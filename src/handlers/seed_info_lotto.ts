import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedInfoLotto(req: Request, res: Response) {
  const last_payment = String(req.body?.last_payment || 'dummy_tx_hash');
  const wining_block = Number(req.body?.wining_block || 123456);
  const round = Number(req.body?.round || 1);
  const wbgl = Number(req.body?.wbgl || 0);

  try {
    await prisma.info_lotto.upsert({
      where: { last_payment },
      update: { wining_block, round, wbgl },
      create: { last_payment, wining_block, round, wbgl },
    });
    res.json({ ok: true, last_payment, wining_block, round, wbgl });
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
}


