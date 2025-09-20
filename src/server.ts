import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from "cors";
import pino from 'pino';
 
import type {
  NFTResponse,
  TicketResponse,
  LastTradeResponse,
  BlockChainData,
  Fun2Response,
} from './types';
import router from './router';
import { startOwnersJob } from './jobs/owners';

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

app.use('/', router);
 

app.use(cors());
app.use(express.json());



const port = Number(process.env.PORT || 8081);
app.listen(port, () => {
  logger.info({ port }, 'Express server listening');
  startOwnersJob();
});


