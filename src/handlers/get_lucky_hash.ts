import type { Request, Response } from 'express';
import { getCurrentBlock } from '../utils/get_current_block';
import { getLuckyBlock } from '../utils/get_lucky_block';
import { getBlockHash } from '../clients/bgl';

export async function getLuckyHash(_req: Request, res: Response) {
  const current = await getCurrentBlock();
  const lucky = await getLuckyBlock();

  if (lucky > 0 && current >= lucky) {
    try {
      const hash = await getBlockHash(lucky);
      const href = `https://bgl.bitaps.com/${lucky}`;
      return res.json({ hash, href });
    } catch (e) {
      return res.status(502).json({ error: 'failed_to_fetch_block_hash' });
    }
  }

  // Ещё не наступил winning_block
  return res.json({ hash: '', href: '' });
}


