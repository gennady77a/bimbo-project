import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Парсим структуру вебхука от Vapi.ai при окончании вызова
    const message = body.message;
    if (message && message.type === "end-of-call-report") {
      const phone = message.customer?.number || "Неизвестно";
      const transcript = message.transcript || "";
      const summary = message.analysis?.summary || "ИИ не составил выжимку.";
      const status = message.analysis?.structuredData?.deal_agreed ? "success_deal" : "rejected";
      const clientName = message.customer?.name || "B2B Клиент";

      await prisma.callLog.create({
        data: { clientName, phone, status, transcript, summary }
      });

      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        const icon = status === "success_deal" ? "🟢" : "🔴";
        const tgMsg = `📞 *Голосовой звонок Vapi завершен\!*\n\n*Клиент:* ${clientName}\n*Статус:* ${icon} ${status === 'success_deal' ? 'Сделка согласована' : 'Отказ'}\n\n*ИИ-Выжимка разговора:*\n_${summary.replace(/[-_.*+?^${}()|[\]\\]/g, '\\$&')}_`;
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: tgMsg, parse_mode: "MarkdownV2" })
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
  }
}