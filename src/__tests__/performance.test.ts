import { describe, it, expect } from '@jest/globals';
import { mintTickets, generateSequence } from '../services/lottery';

/**
 * Тесты производительности для критических сценариев
 * Проверяют работу системы при больших объемах данных
 */
describe('Performance Tests for Large Scale Scenarios', () => {
  
  describe('Large Scale Ticket Generation', () => {
    it('should handle 100k tickets generation efficiently', () => {
      const owners = [
        { address: '0xLARGE1', score: 50000 },
        { address: '0xLARGE2', score: 30000 },
        { address: '0xLARGE3', score: 20000 },
      ];
      
      const sum = 100000;
      const currentBlock = 12345;
      
      const startTime = Date.now();
      const result = mintTickets(sum, currentBlock, owners);
      const endTime = Date.now();
      
      const executionTime = endTime - startTime;
      
      expect(result.tickets).toHaveLength(100000);
      expect(executionTime).toBeLessThan(5000); // должно выполняться менее чем за 5 секунд
      
      console.log(`100k tickets generation took: ${executionTime}ms`);
    });

    it('should handle many small owners efficiently', () => {
      // Создаем 1000 мелких владельцев
      const owners = Array.from({ length: 1000 }, (_, i) => ({
        address: `0x${i.toString(16).padStart(4, '0')}`,
        score: Math.floor(Math.random() * 100) + 10 // от 10 до 109
      }));
      
      const sum = owners.reduce((acc, o) => acc + o.score, 0);
      const currentBlock = 54321;
      
      const startTime = Date.now();
      const result = mintTickets(sum, currentBlock, owners);
      const endTime = Date.now();
      
      const executionTime = endTime - startTime;
      
      expect(result.tickets.length).toBeGreaterThan(0);
      expect(result.map).toBeDefined();
      expect(Object.keys(result.map)).toHaveLength(1000);
      expect(executionTime).toBeLessThan(3000); // менее 3 секунд
      
      console.log(`1000 owners processing took: ${executionTime}ms`);
    });

    it('should measure performance degradation in unfair scenarios', () => {
      const scenarios = [
        {
          name: 'Fair scenario',
          owners: [{ address: '0xFAIR', score: 10000 }],
          sum: 10000
        },
        {
          name: 'Unfair scenario',
          owners: [
            { address: '0xWHALE', score: 1000 },
            { address: '0xSHRIMP', score: 100 }
          ],
          sum: 50000
        }
      ];
      
      scenarios.forEach(scenario => {
        const startTime = Date.now();
        const result = mintTickets(scenario.sum, 12345, scenario.owners);
        const endTime = Date.now();
        
        const executionTime = endTime - startTime;
        const unassigned = result.tickets.filter(t => t === -1).length;
        
        console.log(`${scenario.name}:`);
        console.log(`  Execution time: ${executionTime}ms`);
        console.log(`  Unassigned tickets: ${unassigned}/${result.tickets.length}`);
        console.log(`  Efficiency: ${((result.tickets.length - unassigned) / result.tickets.length * 100).toFixed(1)}%`);
        // 70 процентов распределяется, должно быть 80% и выше
        expect((result.tickets.length - unassigned) / result.tickets.length).toBeGreaterThan(0.8);
        expect(executionTime).toBeLessThan(4000); // менее 4 секунд
      });
    });
  });

  describe('Sequence Generation Performance', () => {
    it('should generate large sequences efficiently', () => {
      const startTime = Date.now();
      const sequence = generateSequence(100000, 12345, 100000);
      const endTime = Date.now();
      
      const executionTime = endTime - startTime;
      
      expect(sequence).toHaveLength(100000);
      expect(executionTime).toBeLessThan(2000); // менее 2 секунд
      
      // Проверяем что это действительно перемешанная последовательность
      expect(sequence).toContain(0);
      expect(sequence).toContain(99999);
      expect(sequence[0]).not.toBe(0); // первый элемент не должен быть 0 (если перемешано)
      
      console.log(`100k sequence generation took: ${executionTime}ms`);
    });

    it('should maintain deterministic behavior under load', () => {
      const iterations = 100;
      const sequences: number[][] = [];
      
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        const seq = generateSequence(1000, 12345, 1000);
        sequences.push(seq);
      }
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Все последовательности должны быть одинаковыми (детерминизм)
      sequences.forEach(seq => {
        expect(seq).toEqual(sequences[0]);
      });
      
      expect(executionTime).toBeLessThan(1000); // менее 1 секунды для 100 итераций
      
      console.log(`${iterations} deterministic sequences took: ${executionTime}ms`);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not cause memory leaks with repeated large operations', () => {
      const initialMemory = process.memoryUsage();
      
      // Выполняем много операций с большими данными
      for (let i = 0; i < 10; i++) {
        const owners = Array.from({ length: 100 }, (_, j) => ({
          address: `0x${(i * 100 + j).toString(16)}`,
          score: Math.floor(Math.random() * 1000) + 100
        }));
        
        mintTickets(50000, i, owners);
      }
      
      // Принудительная сборка мусора (если доступна)
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      
      // Увеличение памяти не должно быть критическим (менее 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});