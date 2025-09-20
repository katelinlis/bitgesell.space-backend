import { ethers } from "ethers";
import { getContract, getProvider } from "../clients/ethers";
import { TokenLocal } from "../services/scoring";

export const getCount = async (address: string,tokens:  TokenLocal[]) : Promise<TokenLocal[]>=>{
    const contractAddress = process.env.ERC1155_CONTRACT || '';
    const ERC1155_ABI = [
      'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])'
    ];
    try {
      const provider = getProvider();
      const contract = getContract(contractAddress, ERC1155_ABI, provider);
      const checksum = ethers.getAddress(address);
      const ids = tokens.map(t => ethers.toBigInt(t.id)).filter(Boolean);
      const owners = ids.map(_ => checksum);
      const batchSize = 120;
      for (let off = 0; off < ids.length; off += batchSize) {
        const idsB = ids.slice(off, off + batchSize);
        const ownB = owners.slice(off, off + batchSize);
        if (!idsB.length) break;
        const balances: readonly bigint[] = await contract.balanceOfBatch(ownB, idsB);
        
        for (let i = 0; i < idsB.length; i++) {
          const idStr = String(idsB[i]);
          const bal = Number((balances as any)[i] ?? 0n);
          const idx = tokens.findIndex(t => t.id === idStr);
          if (idx >= 0 && Number.isFinite(bal)) tokens[idx].count = bal;
        }
      }
    } catch (e) {
      console.log('[ethers balanceOfBatch error]', e)
      // тихо падаем в заглушку, если нет RPC
    }

    return tokens
}