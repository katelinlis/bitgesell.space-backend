import axios from 'axios';

const ALCHEMY = process.env.ALCHEMY_DIRECT_URL || '';
const ALCHEMY_NETWORK = process.env.ALCHEMY_NETWORK || 'polygon-mainnet';

// Example base: https://polygon-mainnet.g.alchemy.com
const baseByNetwork: Record<string, string> = {
  'polygon-mainnet': 'https://polygon-mainnet.g.alchemy.com',
  'eth-mainnet': 'https://eth-mainnet.g.alchemy.com',
};

 

export async function getOwnersForToken(contractAddress: string, tokenId: string): Promise<string[]> {
  const url = `${ALCHEMY}/getOwnersForToken`;
  const { data } = await axios.get(url, {
    timeout: 15000,
    params: { contractAddress, tokenId },
  });
  const owners: (string | null | undefined)[] = data?.owners || [];
  return owners.filter(Boolean) as string[];
}


