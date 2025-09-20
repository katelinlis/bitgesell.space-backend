import axios from 'axios';

const client = axios.create({
  baseURL: 'https://api.opensea.io/v2',
  timeout: 10000,
  headers: { 'X-API-KEY': process.env.OPENSEA_API_KEY || '' },
});
 
 
export async function fetchCollectionNFTs(slug: string, limit = 50) {
  const { data } = await client.get(`/collection/${slug}/nfts`, { params: { limit } });
  return data; // { nfts: [...] }
}