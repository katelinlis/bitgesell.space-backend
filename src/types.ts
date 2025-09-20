export type NFT = {
  identifier?: string;
  collection?: string;
  contract?: string;
  token_standard?: string;
  name?: string;
  description?: string;
  image_url?: string;
  metadata_url?: string;
  created_at?: string;
  updated_at?: string;
  is_disabled: boolean;
  is_nsfw: boolean;
};

export type NFTResponse = { nfts: NFT[] };

export type TicketInfo = { address: string };
export type TicketResponse = { tickets: number[]; map: Record<number, TicketInfo> };

export type LastTradeResponse = { hash: string; href: string };

export type Fun2Response = { address: string; score: number; reward: number };

export type BlockChainData = { winning_block: number; blocks_before: number };



