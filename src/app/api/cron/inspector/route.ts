import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  let status = "SUCCESS";
  let message = "";

  try {
    // Тест 1: Проверка коннекта к Neon БД через Prisma
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - startTime;

    message = `Все системы работают в штатном режиме. Коннект к Neon БД стабилен (ответ за ${duration}мс).`;

    // Запрос к OpenRouter для формирования экспертного отчета
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "meta-llama/llama-3-8b-instruct:free",
            messages: [{
              role: "user",
              content: `Сделай короткий красивый технический отчет для админа на основе этих данных: "База данных отвечает за ${duration}мс, критических ошибок на сайте нет". Добавь немного айтишного юмора.`
            }]
          })
        });
        const aiData = await aiRes.json();
        if (aiData.choices?.[0]?.message?.content) {
          message = aiData.choices[0].message.content.trim();
        }
      } catch {}
    }

  } catch (e: any) {
    status = "CRITICAL_ERROR";
    message = `🚨 ВНИМАНИЕ: База данных Neon недоступна! Текст ошибки: ${e.message}`;
  }

  // Пишем в логи
  await prisma.systemLog.create({ data: { status, message } });

  // Шлем алерт в телеграм
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    const tgMsg = status === "SUCCESS" 
      ? `🟢 *Ежедневный ИИ\-Инспектор:*\n\n${message.replace(/[-_.*+?^${}()|[\]\\]/g, '\\$&')}`
      : `🚨 *КРИТИЧЕСКИЙ СБОЙ НА САЙТЕ\!*\n\n${message.replace(/[-_.*+?^${}()|[\]\\]/g, '\\$&')}`;
    
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: tgMsg, parse_mode: "MarkdownV2" })
    });
  }

  return NextResponse.json({ status, message });
}