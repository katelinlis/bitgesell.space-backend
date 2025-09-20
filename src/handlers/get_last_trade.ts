import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getLastTrade(_req: Request, res: Response) {
  const row = await prisma.info_lotto.findFirst();
  const hash = row?.last_payment ?? '';
  const href = hash ? `https://bscscan.com/tx/${hash}` : '';
  res.json({ hash, href });
}