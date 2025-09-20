import type { Request, Response } from 'express';
import { ownersCache } from '../state/ownersCache';
import { getTicketCount, getWinTickets, mintTickets } from '../services/lottery';
import { getCurrentBlock } from '../utils/get_current_block';
import { getLuckyBlock } from '../utils/get_lucky_block';
import { getBlockHash } from '../clients/bgl';
import { logger } from '../utils/logger';
import { Snapshots } from '../state/snapshots';

export async function getLastWinners(_req: Request, res: Response) {
  try {
    const current = await getCurrentBlock();
    const lucky = await getLuckyBlock();
    logger.info(`Checking winners for block ${current}, lucky block: ${lucky}`);

    // Загружаем снэпшот для lucky block если он есть
    const snapshotBlock = Snapshots.getLatestSnapshot();
    if (snapshotBlock && snapshotBlock >= lucky) {
      await Snapshots.loadSnapshot(lucky);
    }

    const owners = ownersCache.listOwners();
    const sum = owners.reduce((acc, o) => acc + (o.score || 0), 0);
    console.log(sum)

    // Сохраняем снэпшот если текущий блок достиг lucky block
    if (current >= lucky && (!snapshotBlock || snapshotBlock < lucky)) {
      await Snapshots.saveSnapshot(lucky);
    }

    if (!lucky || current < lucky) {
      logger.info('No winners yet - current block not reached lucky block');
      return res.json(["", "there are no winners yet", ""]);
    }

    const ticketCount = getTicketCount(sum);
    const h = await getBlockHash(lucky);
    const winners = getWinTickets(h, ticketCount).reverse();
    const block = current >= lucky ? lucky : current;
    const { tickets, map } = mintTickets(sum, block, owners);
    
    const result: string[] = [];
    for (const w of winners) {
      if (w >= 0 && tickets[w] < owners.length) {
        let owner = owners[tickets[w]]
        result.push(owner.address);
        logger.info(`Winner found: ${owner.address} with ticket ${w}`);
      } else {
        //logger.info()
        result.push('no winner');
        logger.warn(`Invalid winner index: ${w}`);
      }
    }
    
    logger.info(`Winners determined: ${result.join(', ')}`);
    res.json(result);
  } catch (error) {
    logger.error(`Error in getLastWinners: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
}


