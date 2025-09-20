import { getBlockCount } from '../clients/bgl';

export async function getCurrentBlock(): Promise<number> {
  try {
    const n = await getBlockCount();
    console.log('[BGL] getCurrentBlock', n);
    return n;
  } catch(error) {
    console.error('[BGL] getCurrentBlock error', error);
    return 0;
  }
}

