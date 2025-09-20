import axios from 'axios';

type JsonRpcRequest = { jsonrpc: '2.0'; id: number; method: string; params?: unknown[] };
type JsonRpcResponse<T> = { jsonrpc: '2.0'; id: number; result?: T; error?: { code: number; message: string } };

const BGL_RPC_URL = process.env.BGL_RPC_URL || '';
const BGL_RPC_USER = process.env.BGL_RPC_USER || '';
const BGL_RPC_PASS = process.env.BGL_RPC_PASS || '';

if (!BGL_RPC_URL) {
  // eslint-disable-next-line no-console
  console.warn('[BGL] BGL_RPC_URL is not set; getBlockCount/getBlockHash will return 0');
}

const client = axios.create({
  baseURL: BGL_RPC_URL,
  timeout: 8000,
  auth: BGL_RPC_USER || BGL_RPC_PASS ? { username: BGL_RPC_USER, password: BGL_RPC_PASS } : undefined,
});

let nextId = 1;
async function rpcCall<T>(method: string, params: unknown[] = []): Promise<T> {
  const req: JsonRpcRequest = { jsonrpc: '2.0', id: nextId++, method, params };
  // eslint-disable-next-line no-console
  console.log('[BGL] RPC request', { method, params });
  const { data } = await client.post<JsonRpcResponse<T>>('', req);
  // eslint-disable-next-line no-console
  console.log('[BGL] RPC response', { method, ok: !data.error });
  if (data.error) throw new Error(`BGL RPC error ${data.error.code}: ${data.error.message}`);
  return data.result as T;
}

export async function getBlockCount(): Promise<number> {
    console.log('BGL_RPC_URL', BGL_RPC_URL);
  return rpcCall<number>('getblockcount');
}

export async function getBlockHash(height: number): Promise<string> {
  return rpcCall<string>('getblockhash', [height]);
}


