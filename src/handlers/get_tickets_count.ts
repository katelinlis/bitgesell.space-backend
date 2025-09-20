import type { Request, Response } from 'express';
import { ownersCache } from '../state/ownersCache';
import { getTicketCount } from '../services/lottery';

export async function getTicketsCount(_req: Request, res: Response) {
  const owners = ownersCache.listOwners();
  const sum = owners.reduce((acc, o) => acc + (o.score || 0), 0);
  const count = getTicketCount(sum);
  res.json(count);
}


