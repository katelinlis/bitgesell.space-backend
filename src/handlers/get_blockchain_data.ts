import type { Request, Response } from 'express';
import { getCurrentBlock } from '../utils/get_current_block';
import { getLuckyBlock } from '../utils/get_lucky_block';

export async function getBlockchainData(_req: Request, res: Response) {
  const current = await getCurrentBlock();
  console.log('current', current);
  const lucky = await getLuckyBlock();
  const blocks_before = current <= lucky ? lucky - current : 0;
  res.json({ winning_block: lucky, blocks_before });
}