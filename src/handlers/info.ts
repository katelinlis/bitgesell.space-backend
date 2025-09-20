import type { Request, Response } from 'express';
import { fetchCollectionNFTs } from '../clients/opensea';

export async function getInfo(_req: Request, res: Response) {
  const slug = process.env.OPENSEA_COLLECTION_SLUG || 'bitgesell-road';
  const data = await fetchCollectionNFTs(slug, 50);
  res.json(data);
}