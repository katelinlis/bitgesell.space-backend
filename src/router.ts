import express, { Request, Response } from 'express';
 
import type {
  TicketResponse,
  Fun2Response,
  LastTradeResponse,
} from './types';
import { getLastTrade } from './handlers/get_last_trade';
import { getRound } from './handlers/get_round';
import { getBlockchainData } from './handlers/get_blockchain_data';
import { getInfo } from './handlers/info';
import { getNftByAddress } from './handlers/nft_by_address';
import { initDb } from './handlers/init_db';
import { getOwners } from './handlers/get_owners';
import { seedInfoLotto } from './handlers/seed_info_lotto';
import { getLuckyHash } from './handlers/get_lucky_hash';
import { getTicketsCount } from './handlers/get_tickets_count';
import { getTickets } from './handlers/get_tickets';
import { getLastWinners } from './handlers/get_last_winners';
import { getPayment } from './handlers/get_payment';
import { getWbgl } from './handlers/get_wbgl';
import { ownersCache } from './state/ownersCache';

const app = express.Router();

app.get('/', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'opensea-lotto-express' });
  });
  
  // Stubs for parity with Rust routes (minimal typing)
  app.get('/info', getInfo);
 app.get('/get_blockchain_data', getBlockchainData);
  app.get('/get_round', getRound);
 
  app.get('/get_tickets_count', getTicketsCount);
  app.get('/get_tickets', getTickets);
  app.get('/get_last_winners', getLastWinners);
  app.get('/get_owners', getOwners);
  app.get('/get_lucky_hash', getLuckyHash);
  // новый обработчик с кэшем
 
  app.get('/get_last_trade', getLastTrade);
  app.get('/get_pages/:limit', (req: { params: { limit: any; }; }, res: { json: (arg0: number) => void; }) => {
    const limit = Number(req.params.limit) || 1;

     let owners = ownersCache.listOwners();

    res.json(Math.max(1, Math.ceil(owners.length / limit)));
  });
  app.get('/get_payment', getPayment);
  app.get('/get_wbgl', getWbgl);
  app.get('/nft/:address', getNftByAddress);
  app.post('/init_tokens', initDb);

  export default app;