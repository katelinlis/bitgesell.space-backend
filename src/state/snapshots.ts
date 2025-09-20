import fs from 'fs';
import path, { dirname } from 'path';
import { logger } from '../utils/logger';
import { ownersCache } from './ownersCache';

const SNAPSHOTS_DIR = path.join(process.cwd(), 'snapshots');

export class Snapshots {
  static async saveSnapshot(blockNumber: number): Promise<void> {
    try {
      // Создаем директорию если не существует
      if (!fs.existsSync(SNAPSHOTS_DIR)) {
        fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
      }

      const owners = ownersCache.listOwners();
      const snapshotData = owners.map(owner => ({
        address: owner.address,
        score: owner.score
      }));

      const filePath = path.join(SNAPSHOTS_DIR, `${blockNumber}.json`);
      fs.writeFileSync(filePath, JSON.stringify(snapshotData, null, 2));
      
      logger.info(`Snapshot saved for block ${blockNumber}`);
    } catch (error) {
      logger.error(`Error saving snapshot: ${error}`);
      throw error;
    }
  }

  static async loadSnapshot(blockNumber: number): Promise<void> {
    try {
      const filePath = path.join(SNAPSHOTS_DIR, `${blockNumber}.json`);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Snapshot for block ${blockNumber} not found`);
      }

      const data = fs.readFileSync(filePath, 'utf-8');
      const owners = JSON.parse(data);

      ownersCache.clear();
      owners.forEach((owner: {address: string, score: number}) => {
        ownersCache.setOwner(owner.address, owner.score);
      });

      logger.info(`Snapshot loaded for block ${blockNumber}`);
    } catch (error) {
      logger.error(`Error loading snapshot: ${error}`);
      throw error;
    }
  }

  static getLatestSnapshot(): number | null {
    try {
      if (!fs.existsSync(SNAPSHOTS_DIR)) {
        return null;
      }

      const files = fs.readdirSync(SNAPSHOTS_DIR)
        .filter(file => file.endsWith('.json'))
        .map(file => parseInt(file.replace('.json', '')))
        .filter(block => !isNaN(block));

      return files.length > 0 ? Math.max(...files) : null;
    } catch (error) {
      logger.error(`Error getting latest snapshot: ${error}`);
      return null;
    }
  }
}