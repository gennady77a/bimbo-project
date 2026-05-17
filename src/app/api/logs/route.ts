import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
  const sysLogs = await prisma.systemLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
  const callLogs = await prisma.callLog.findMany({ orderBy: { createdAt: 'desc' } });
  
  return NextResponse.json({ orders, sysLogs, callLogs });
}