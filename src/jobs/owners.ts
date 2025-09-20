import { PrismaClient } from '@prisma/client';
import { ownersCache } from '../state/ownersCache';
import { getCount } from '../utils/getCount';
import { getPts, type TokenLocal } from '../services/scoring';
import { getOwnersForToken } from '../clients/alchemy';

const prisma = new PrismaClient();

async function computeScoreForAddress(address: string): Promise<number> {
  const db = await prisma.tokens.findMany({ orderBy: { index: 'asc' } });
  let tokens: TokenLocal[] = db.map((t) => ({
    index: t.index,
    id: t.id ?? '',
    count: t.count ?? 0,
    bracket: t.bracket ?? 0,
    level: (t.level ?? 'Common') as TokenLocal['level'],
  }));
  tokens = tokens.filter((t) => t.id && t.id !== 'NO_VALUE');
  tokens = await getCount(address, tokens);
  const sum = getPts(tokens);
  return sum;
}

export function startOwnersJob() {
  const refreshSec = Number(process.env.OWNERS_REFRESH_SEC || 300);
  const contract = process.env.ERC1155_CONTRACT || '';
  if (!contract) {
    console.warn('[ownersJob] ERC1155_CONTRACT not set; job is idle');
    return;
  }

  const run = async () => {
    console.log('[ownersJob] refresh start;');
    try {
      const db = await prisma.tokens.findMany({ orderBy: { index: 'asc' } });
      const tokenIds = db.map((t) => t.id).filter((id): id is string => Boolean(id) && id !== 'NO_VALUE');
      const uniqueOwners = new Set<string>();
      for (const id of tokenIds) {
        try {
          const owners = (await getOwnersForToken(contract, id));
          
          owners.forEach((o) => o != "0x4c1c5403e419d736f267bbac8911454bd0ba9043" && uniqueOwners.add(o));
        } catch (e) {
          console.error('[ownersJob] getOwnersForToken error', { id }, e);
        }
      }

      ownersCache.clear()
      const owners = Array.from(uniqueOwners);
      console.log('[ownersJob] owners collected:', owners.length);
      for (const addr of owners) {
        try {
          const score = await computeScoreForAddress(addr);
          //setOwnerScore(addr, score);
          ownersCache.setOwner(addr,score)
        } catch (e) {
          console.error('[ownersJob] score error for', addr, e);
        }
      }
    } catch (e) {
      console.error('[ownersJob] refresh error', e);
    }
    console.log('[ownersJob] refresh done');
  };

  run();
  setInterval(run, refreshSec * 1000);
}


