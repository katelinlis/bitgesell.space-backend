import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getPts, getPtsByGrade, type TokenLocal } from '../services/scoring';
import { getCount } from '../utils/getCount';

declare global {
    interface BigInt {
        toJSON(): Number;
    }
}

BigInt.prototype.toJSON = function () { return Number(this) }

const prisma = new PrismaClient();

export async function getNftByAddress(req: Request, res: Response) {
  
  const { address } = req.params;
  if (!address) return res.status(400).json({ error: 'address required' });

  // Берём список токенов из БД (как в Rust make_nft_array)
  const db = await prisma.tokens.findMany({ orderBy: { index: 'asc' } });
  let tokens: TokenLocal[] = db.map(t => ({
    index: t.index,
    is_full: false,
    id: t.id ?? '',
    count: t.count ?? 0,
    bracket: t.bracket ?? 0,
    level: (t.level ?? 'Common') as TokenLocal['level'],
  }));

 
  tokens =  await getCount(address,tokens)

  tokens.forEach((tokenLocal, index) => {
  const bracketTmp = tokenLocal.bracket;
  const isFull = tokens
    .filter(t => t.bracket === bracketTmp)
    .every(t => t.count > 0);

  tokens[index].is_full = isFull;
});

  // Если задан провайдер и контракт — получаем реальные балансы (ERC1155 balanceOfBatch)

  const sum_pts = getPts(tokens);
  const pts_by_grade = getPtsByGrade(tokens);

  res.json({ address, nfts: tokens, sum_pts, pts_by_grade });
}


