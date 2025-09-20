import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getLuckyBlock(): Promise<number> {
  const row = await prisma.info_lotto.findFirst();
  return row?.wining_block ?? 0;
}

