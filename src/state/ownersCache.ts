// Кэш владельцев NFT с их баллами (score)
// Аналог Rust реализации из new/opensea_api/src/utils.rs

import { logger } from '../utils/logger';
import { getCurrentBlock } from '../utils/get_current_block';
import { getLuckyBlock } from '../utils/get_lucky_block';

type Owner = {
  address: string;
  score: number;
};

class OwnersCache {
  private cache: Map<string, Owner>;
  private static instance: OwnersCache;
  private updateInterval?: NodeJS.Timeout;
  private readonly UPDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 минут

  private constructor() {
    this.cache = new Map();
    this.startAutoUpdate();
  }

  private async startAutoUpdate(): Promise<void> {
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateOwners();
        logger.info('Owners cache updated successfully');
      } catch (error) {
        logger.error(`Failed to update owners cache: ${error}`);
      }
    }, this.UPDATE_INTERVAL_MS);
  }

  private async updateOwners(): Promise<void> {
    const currentBlock = await getCurrentBlock();
    const luckyBlock = await getLuckyBlock();
    logger.info(`Updating owners cache at block ${currentBlock}, lucky block: ${luckyBlock}`);

    try {
      // Получаем данные владельцев из OpenSea API
      const response = await fetch('https://api.opensea.io/v2/collection/new-bitgesell-road/nfts?limit=50', {
        headers: {
          'accept': 'application/json',
          'X-API-KEY': '71ddd979592c4a1ab3a3c4e9a1d6924c'
        }
      });

      if (!response.ok) {
        throw new Error(`OpenSea API error: ${response.statusText}`);
      }

      const data = await response.json();
      const nfts = data.nfts;

      // Очищаем текущий кэш
      this.clear();

      // Обновляем кэш новыми данными
      for (const nft of nfts) {
        if (nft.owners && nft.owners.length > 0) {
          const ownerAddress = nft.owners[0].address;
          // Здесь должна быть логика расчета score для каждого владельца
          // Временно используем фиксированное значение
          this.setOwner(ownerAddress, 1);
        }
      }

      logger.info(`Cache updated with ${this.size()} owners`);
    } catch (error) {
      logger.error(`Error updating owners cache: ${error}`);
      throw error;
    }
  }

  public static getInstance(): OwnersCache {
    if (!OwnersCache.instance) {
      OwnersCache.instance = new OwnersCache();
    }
    return OwnersCache.instance;
  }

  // Добавить/обновить владельца
  public setOwner(address: string, score: number): void {
    this.cache.set(address.toLowerCase(), { address, score });
  }

  // Получить владельца
  public getOwner(address: string): Owner | undefined {
    return this.cache.get(address.toLowerCase());
  }

  // Удалить владельца
  public removeOwner(address: string): void {
    this.cache.delete(address.toLowerCase());
  }

  // Получить всех владельцев (отсортированных по score)
  public listOwners(): Owner[] {
    return Array.from(this.cache.values())
      .sort((a, b) => b.score - a.score || a.address.localeCompare(b.address));
  }

  // Очистить кэш
  public clear(): void {
    this.cache.clear();
  }

  // Количество записей
  public size(): number {
    return this.cache.size;
  }
}

export const ownersCache = OwnersCache.getInstance();