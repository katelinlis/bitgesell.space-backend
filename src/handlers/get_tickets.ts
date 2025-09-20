import type { Request, Response } from 'express';
import { ownersCache } from '../state/ownersCache';
import { getCurrentBlock } from '../utils/get_current_block';
import { getLuckyBlock } from '../utils/get_lucky_block';
import { mintTickets } from '../services/lottery';

export async function getTickets(_req: Request, res: Response) {
  const owners = ownersCache.listOwners();
  const sum = owners.reduce((acc, o) => acc + (o.score || 0), 0);
  const lucky = await getLuckyBlock();
  const current = await getCurrentBlock();
  const block = current >= lucky ? lucky : current;
  const { tickets, map } = mintTickets(sum, block, owners);
  res.json({ tickets, map });
}


