import type { Request, Response } from 'express';
import { logger } from '../utils/logger';
    import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


export async function getWbgl(_req: Request, res: Response) {
  try {
   const row = await prisma.info_lotto.findFirst(); 
    res.json(row?.wbgl);
  } catch (error) {
    logger.error(`Error calculating WBGL: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
}