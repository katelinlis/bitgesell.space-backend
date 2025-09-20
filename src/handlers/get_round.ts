import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getRound(_req: Request, res: Response) {
  const row = await prisma.info_lotto.findFirst();
  res.json(row?.round ?? 0);
}
 

 