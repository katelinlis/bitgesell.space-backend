import { ethers, Network } from 'ethers';

// Singleton провайдер со статической сетью (Polygon Mainnet, chainId 137)
let providerSingleton: ethers.JsonRpcProvider | null = null;

export function getProvider(): ethers.JsonRpcProvider {
  if (providerSingleton) return providerSingleton;
  const url = process.env.MATIC_RPC_URL;
  if (!url) {
    throw new Error('RPC URL not set. Provide MATIC_RPC_URL or ETH_RPC_URL in .env');
  }
  const network = new Network('matic', 137);
  providerSingleton = new ethers.JsonRpcProvider(url, network, {
    staticNetwork: network,
  });
  return providerSingleton;
}

export function getContract(address: string, abi: any, provider: ethers.Provider) {
  return new ethers.Contract(address, abi, provider);
}


