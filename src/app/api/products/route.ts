import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { title, description, price, badge, imageUrl, color } = body;

    // Взаимодействие с OpenRouter ИИ для полировки описания
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
              content: `Сделай премиальное, продающее описание для товара "${title}". Вот исходный текст: "${description}". Выведи строго только улучшенный текст описания на русском языке, без лишних фраз.`
            }]
          })
        });
        const aiData = await aiRes.json();
        if (aiData.choices?.[0]?.message?.content) {
          description = aiData.choices[0].message.content.trim();
        }
      } catch (e) {
        console.error("OpenRouter error, используем базовое описание", e);
      }
    }

    const product = await prisma.product.create({
      data: { title, description, price, badge, imageUrl: imageUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e", color }
    });

    // Отправка уведомления в закрытый Telegram-канал
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      const tgMsg = `🛒 *Добавлен новый премиум-товар\!*\n\n*Название:* ${title.replace(/[-_.*+?^${}()|[\]\\]/g, '\\$&')}\n*Цена:* ${price} BYN\n\n⚡ _Описание оптимизировано нейросетью OpenRouter_`;
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: tgMsg, parse_mode: "MarkdownV2" })
      });
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: "Ошибка создания товара" }, { status: 500 });
  }
}