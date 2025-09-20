import type { Request, Response } from 'express';
import { ownersCache } from '../state/ownersCache';

export async function getOwners(req: Request, res: Response) {
  const limit = Math.max(0, Number(req.query.limit) || 0);
  const page = Math.max(1, Number(req.query.page) || 1);
  const search = String(req.query.search || req.query.match || '').toLowerCase();

  let owners = ownersCache.listOwners();
  // фильтр по поиску
  if (search) owners = owners.filter(o => o.address.toLowerCase() === search);

  // сортировка по score desc, затем по адресу asc
  owners.sort((a, b) => (b.score - a.score) || a.address.localeCompare(b.address));

  if (!limit) return res.json(owners);

  const start = (page - 1) * limit;
  const slice = owners.slice(start, start + limit);
  res.json(slice);
}


