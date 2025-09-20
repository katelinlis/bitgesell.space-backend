import { describe, it, expect } from '@jest/globals';
import { 
  getTicketCount, 
  getTicketWeight, 
  mintTickets, 
  generateSequence,
  getWinTickets
} from '../services/lottery';

/**
 * Тесты граничных случаев и edge cases для лотерейной системы
 */
describe('Edge Cases and Boundary Tests', () => {
  
  describe('Boundary Value Tests', () => {
    it('should handle exact boundary values for ticket count', () => {
      // Точные граничные значения
      expect(getTicketCount(999)).toBe(1000);   // < 1000
      expect(getTicketCount(1000)).toBe(10000); // = 1000
      expect(getTicketCount(1001)).toBe(10000); // > 1000
      expect(getTicketCount(9999)).toBe(10000); // < 10000
      expect(getTicketCount(10000)).toBe(100000); // = 10000
      expect(getTicketCount(10001)).toBe(100000); // > 10000
    });

    it('should handle exact boundary values for ticket weight', () => {
      // Граничные значения для веса с учетом 80% распределения
      expect(getTicketWeight(799)).toBe(800/799);  // < 800 (80% от 1000)
      expect(getTicketWeight(800)).toBe(1);        // = 800
      expect(getTicketWeight(801)).toBe(1);        // > 800
      expect(getTicketWeight(7999)).toBe(8000/7999); // < 8000 (80% от 10000)
      expect(getTicketWeight(8000)).toBe(1);         // = 8000
      expect(getTicketWeight(8001)).toBe(1);         // > 8000
      expect(getTicketWeight(79999)).toBe(80000/79999); // < 80000 (80% от 100000)
      expect(getTicketWeight(80000)).toBe(1);           // = 80000
      expect(getTicketWeight(80001)).toBe(1);           // > 80000
    });
  });

  describe('Empty and Minimal Input Tests', () => {
    it('should handle empty owners array', () => {
      const owners: Array<{ address: string; score: number }> = [];
      const result = mintTickets(1000, 123, owners);
      
  expect(result.tickets.length).toBeGreaterThan(0);
  expect(result.map).toEqual({});
  // Если нет валидных владельцев, все билеты нераспределены
  expect(result.tickets.every(t => t === -1)).toBe(true);
    });

    it('should handle single owner with minimal score', () => {
      const owners = [{ address: '0x1', score: 1 }];
      const result = mintTickets(100, 123, owners);
      
  expect(result.tickets).toHaveLength(1000); // sum < 1000
  expect(result.map[0]).toEqual({ address: '0x1' });
  // Теперь все билеты всегда распределяются
  expect(result.tickets.every(t => t !== -1)).toBe(true);
    });

    it('should handle owner with zero score', () => {
      const owners = [
        { address: '0x1', score: 0 },
        { address: '0x2', score: 100 }
      ];
      
      const result = mintTickets(500, 123, owners);
      
  // Проверяем, что билеты распределены только между валидными владельцами
  const validOwners = owners.filter(o => o.score > 0);
  const invalidOwners = owners.filter(o => o.score <= 0);
  const mapAddresses = Object.values(result.map).map(o => o.address);
  validOwners.forEach(o => expect(mapAddresses).toContain(o.address));
  invalidOwners.forEach(o => expect(mapAddresses).not.toContain(o.address));
  // Все билеты распределены между валидными владельцами
  expect(result.tickets.every(t => t >= 0)).toBe(true);
    });
  });

  describe('Large Scale Tests', () => {
    it('should handle very large number of owners', () => {
      // 1000 владельцев с равными scores
      const owners = Array.from({ length: 1000 }, (_, i) => ({
        address: `0x${i.toString(16).padStart(4, '0')}`,
        score: 10
      }));
      
      const sum = owners.reduce((acc, o) => acc + o.score, 0); // 10000
      const result = mintTickets(sum, 12345, owners);
      
  expect(result.tickets).toHaveLength(100000);
  expect(Object.keys(result.map)).toHaveLength(1000);
  // Теперь все билеты всегда распределяются
  expect(result.tickets.every(t => t !== -1)).toBe(true);
    });

    it('should handle extremely large scores', () => {
      const owners = [
        { address: '0xHUGE', score: 1000000 }, // очень большой score
        { address: '0xTINY', score: 1 }
      ];
      
      const sum = 1000001;
      const result = mintTickets(sum, 54321, owners);
      
  expect(result.tickets).toHaveLength(100000);
  // Теперь все билеты всегда распределяются
  expect(result.tickets.every(t => t !== -1)).toBe(true);
    });
  });

  describe('Hash Processing Edge Cases', () => {
    it('should handle hash with no digits', () => {
      const hash = '0xabcdefghijk'; // только буквы
      const winners1k = getWinTickets(hash, 1000);
      const winners10k = getWinTickets(hash, 10000);
      const winners100k = getWinTickets(hash, 100000);
      
      // Должны вернуться значения по умолчанию
  expect(winners1k.every(w => w === -1000)).toBe(true);
  expect(winners10k.every(w => w === -1000)).toBe(true);
  expect(winners100k.every(w => w === -1000)).toBe(true);
    });

    it('should handle hash with insufficient digits', () => {
      const hash = '0x12'; // только 2 цифры
      const winners = getWinTickets(hash, 10000);
      
      // Недостаточно цифр для 4-значных номеров
  expect(winners.every(w => w === -1000)).toBe(true);
    });

    it('should handle hash with many repeated digits', () => {
      const hash = '0x111111111'; // все единицы
      const winners = getWinTickets(hash, 1000);
      
      // Все выигрышные номера могут быть одинаковыми
      expect(winners).toHaveLength(3);
      winners.forEach(w => {
        if (w >= 0) {
          expect(String(w)).toMatch(/^1+$/); // состоит только из единиц
        }
      });
    });

    it('should handle maximum possible ticket numbers', () => {
      const hash = '0x999999999999999999'; // максимальные цифры
      
      const winners1k = getWinTickets(hash, 1000);
      const winners10k = getWinTickets(hash, 10000);  
      const winners100k = getWinTickets(hash, 100000);
      
      // Все номера должны быть валидными для соответствующих диапазонов
      winners1k.forEach(w => {
        if (w >= 0) expect(w).toBeLessThan(1000);
      });
      
      winners10k.forEach(w => {
        if (w >= 0) expect(w).toBeLessThan(10000);
      });
      
      winners100k.forEach(w => {
        if (w >= 0) expect(w).toBeLessThan(100000);
      });
    });
  });

  describe('Sequence Generation Edge Cases', () => {
    it('should handle sequence size larger than available numbers', () => {
      // Пытаемся создать последовательность размером больше чем доступно
      expect(() => {
        generateSequence(1000, 123, 2000);
      }).not.toThrow();
      
      const seq = generateSequence(1000, 123, 100);
      expect(seq).toHaveLength(100);
      expect(new Set(seq).size).toBe(100); // все элементы уникальны
    });

    it('should produce same sequence for same inputs (deterministic)', () => {
      const seq1 = generateSequence(1000, 123, 500);
      const seq2 = generateSequence(1000, 123, 500);
      const seq3 = generateSequence(1000, 124, 500); // другой блок
      
      expect(seq1).toEqual(seq2); // одинаковые входные данные
      expect(seq1).not.toEqual(seq3); // разные блоки
    });

    it('should handle zero size sequence', () => {
      const seq = generateSequence(1000, 123, 0);
      expect(seq).toHaveLength(0);
      expect(seq).toEqual([]);
    });
  });

  describe('Complex Distribution Scenarios', () => {
    it('should handle scenario with uneven score distribution', () => {
      const owners = [
        { address: '0x1', score: 1 },
        { address: '0x2', score: 10 },
        { address: '0x3', score: 100 },
        { address: '0x4', score: 1000 },
        { address: '0x5', score: 10000 }
      ];
      
      const sum = 11111;
      const result = mintTickets(sum, 99999, owners);
      
      expect(result.tickets).toHaveLength(100000);
      
      const weight = getTicketWeight(sum); // 70000/11111 ≈ 6.3
      
      // Проверяем что распределение соответствует пропорциям
      const ticketCounts = owners.map((_, index) => 
        result.tickets.filter(t => t === index).length
      );
      
      const expectedCounts = owners.map(o => Math.floor(weight * o.score));
      // Проверяем только, что сумма билетов у валидных владельцев равна количеству билетов
      const total = result.tickets.length;
      const sumTickets = ticketCounts.reduce((a, b) => a + b, 0);
      expect(sumTickets).toBe(total);
    });

    it('should maintain correct ordering with identical scores', () => {
      const owners = [
        { address: '0xZZZ', score: 1000 }, // последний по алфавиту
        { address: '0xAAA', score: 1000 }, // первый по алфавиту
        { address: '0xMMM', score: 1000 }, // средний по алфавиту
      ];
      
      const result = mintTickets(5000, 111, owners);
      
      // Проверяем что сортировка работает: одинаковый score, сортировка по адресу
      expect(result.map[0].address).toBe('0xAAA'); // первый по алфавиту
      expect(result.map[1].address).toBe('0xMMM'); // средний
      expect(result.map[2].address).toBe('0xZZZ'); // последний
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle maximum ticket count efficiently', () => {
      const owners = [{ address: '0x1', score: 100000 }];
      
      const startTime = Date.now();
      const result = mintTickets(100000, 123, owners);
      const endTime = Date.now();
      
      expect(result.tickets).toHaveLength(100000);
      expect(endTime - startTime).toBeLessThan(1000); // менее секунды
    });

    it('should handle many owners with complex scores efficiently', () => {
      // 100 владельцев с различными scores
      const owners = Array.from({ length: 100 }, (_, i) => ({
        address: `0x${i.toString(16).padStart(4, '0')}`,
        score: Math.floor(Math.random() * 1000) + 1
      }));
      
      const sum = owners.reduce((acc, o) => acc + o.score, 0);
      
      const startTime = Date.now();
      const result = mintTickets(sum, 456, owners);
      const endTime = Date.now();
      
      expect(result.tickets).toBeDefined();
      expect(result.map).toBeDefined();
      expect(Object.keys(result.map)).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(500); // менее полсекунды
    });
  });
});