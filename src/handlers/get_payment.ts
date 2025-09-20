import type { Request, Response } from 'express';
import { ownersCache } from '../state/ownersCache';
import { logger } from '../utils/logger';
import { getLuckyBlock } from '../utils/get_lucky_block';
import { getCurrentBlock } from '../utils/get_current_block';

export async function getPayment(_req: Request, res: Response) {
  try {
    const owners = ownersCache.listOwners();
    const currentBlock = await getCurrentBlock();
    const luckyBlock = await getLuckyBlock();

    if (currentBlock < luckyBlock) {
      return res.status(400).json({ error: 'Lucky block not reached yet' });
    }

    const totalScore = owners.reduce((sum, owner) => sum + owner.score, 0);
    const payments = owners.map(owner => ({
      address: owner.address,
      amount: (owner.score / totalScore).toFixed(8)
    }));

    logger.info(`Processed payments for ${owners.length} owners`);
    res.json(payments);
  } catch (error) {
    logger.error(`Payment calculation failed: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
}