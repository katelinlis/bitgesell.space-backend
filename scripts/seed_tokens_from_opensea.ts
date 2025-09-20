import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

type OpenSeaNFT = { identifier?: string };
type OpenSeaPage = { nfts: OpenSeaNFT[]; next?: string };

async function main() {
  const prisma = new PrismaClient();
  const slug = process.env.OPENSEA_COLLECTION_SLUG || 'bitgesell-road';
  const apiKey = process.env.OPENSEA_API_KEY || '';
  const maxPages = Number(process.env.SEED_MAX_PAGES || 50);
  const pageLimit = Number(process.env.SEED_PAGE_LIMIT || 50);

  const client = axios.create({
    baseURL: 'https://api.opensea.io/v2',
    timeout: 15000,
    headers: apiKey ? { 'X-API-KEY': apiKey } : undefined,
  });

  let cursor: string | undefined = undefined;
  let page = 0;
  let index = 0;
  const seen = new Set<string>();

  // ensure table exists (db push if needed suggested in README)

  while (page < maxPages) {
    const params: Record<string, any> = { limit: pageLimit };
    if (cursor) params.next = cursor;
    const { data } = await client.get<OpenSeaPage>(`/collection/${slug}/nfts`, { params });
    const nfts = data?.nfts || [];
    if (!nfts.length) break;

    for (const nft of nfts) {
      const id = nft.identifier;
      if (!id) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      // Upsert by primary key index or create next sequential index
      // We use index as sequential; increment locally
      await prisma.tokens.upsert({
        where: { index },
        update: { id, count: 0, bracket: 0, level: 'Common' },
        create: { index, id, count: 0, bracket: 0, level: 'Common' },
      });
      index += 1;
    }

    cursor = (data as any).next || undefined;
    page += 1;
    if (!cursor) break;
  }

  console.log(`Seeded tokens: ${index} ids from OpenSea (${page} pages).`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Seed failed', e);
  process.exit(1);
});


