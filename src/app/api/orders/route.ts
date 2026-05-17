import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { sum, items } = await req.json();
    const orderId = "BMB-" + Math.floor(100000 + Math.random() * 900000);
    
    const order = await prisma.order.create({
      data: { 
        orderIdString: orderId, 
        sum, 
        status: "Ожидает оплаты ЕРИП", 
        date: new Date().toLocaleDateString(),
        itemsJson: JSON.stringify(items || [])
      }
    });

    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      const tgMsg = `💰 *Новый заказ в системе ЕРИП\!*\n\n*ID Заказа:* \`${orderId}\`\n*Сумма к оплате:* *${sum} BYN*\n*Статус:* Ожидает проведения платежа`;
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: tgMsg, parse_mode: "MarkdownV2" })
      });
    }

    return NextResponse.json(order);
  } catch (e) {
    console.error("Error creating order:", e);
    return NextResponse.json({ error: "Ошибка ордера" }, { status: 500 });
  }
}
