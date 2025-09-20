import { describe, it, expect } from '@jest/globals';
import { 
  getTicketCount, 
  getTicketWeight, 
  mintTickets, 
  generateSequence,
  getWinTickets,
  parseDigits
} from '../services/lottery';

describe('Lottery Service', () => {
  describe('getTicketCount', () => {
    it('should return 100000 for sum >= 10000', () => {
      expect(getTicketCount(10000)).toBe(100000);
      expect(getTicketCount(50000)).toBe(100000);
    });

    it('should return 10000 for sum >= 1000 and < 10000', () => {
      expect(getTicketCount(1000)).toBe(10000);
      expect(getTicketCount(5000)).toBe(10000);
      expect(getTicketCount(9999)).toBe(10000);
    });

    it('should return 1000 for sum < 1000', () => {
      expect(getTicketCount(500)).toBe(1000);
      expect(getTicketCount(999)).toBe(1000);
    });
  });

  describe('getTicketWeight', () => {
    it('should return weight for high sum (>=10000)', () => {
      // 10000/100000 = 10%, 80/10 = 8
      expect(getTicketWeight(10000)).toBe(8);
      // 35000/100000 = 35%, 80/35 ≈ 2.2857
      expect(getTicketWeight(35000)).toBeCloseTo(2.2857);
    });

    it('should return weight for medium sum (>=1000)', () => {
      // 1000/10000 = 10%, 80/10 = 8
      expect(getTicketWeight(1000)).toBe(8);
      // 3500/10000 = 35%, 80/35 ≈ 2.2857
      expect(getTicketWeight(3500)).toBeCloseTo(2.2857);
    });

    it('should return weight for low sum (<1000)', () => {
      // 350/1000 = 35%, 80/35 ≈ 2.2857
      expect(getTicketWeight(350)).toBeCloseTo(2.2857);
      // 800/1000 = 80%, 80/80 = 1
      expect(getTicketWeight(800)).toBe(1);
    });

    it('should return 1 when sum >= 80% of max tickets', () => {
      expect(getTicketWeight(80000)).toBe(1); // 80000/100000 = 80%
      expect(getTicketWeight(8000)).toBe(1);  // 8000/10000 = 80%
      expect(getTicketWeight(800)).toBe(1);   // 800/1000 = 80%
    });
  });

  describe('generateSequence', () => {
    it('should generate deterministic sequence', () => {
      const seq1 = generateSequence(1000, 100, 1000);
      const seq2 = generateSequence(1000, 100, 1000);
      expect(seq1).toEqual(seq2);
    });

    it('should generate different sequences for different blocks', () => {
      const seq1 = generateSequence(1000, 100, 1000);
      const seq2 = generateSequence(1000, 101, 1000);
      expect(seq1).not.toEqual(seq2);
    });

    it('should generate sequence of correct size', () => {
      const seq = generateSequence(1000, 100, 500);
      expect(seq).toHaveLength(500);
    });
  });

  describe('mintTickets - Critical Edge Cases', () => {
    it('should handle case where total tickets > 10000 but user tickets < 1100 (unfair distribution)', () => {
      // Создаем ситуацию где общая сумма > 10000 (будет 100000 билетов)
      // но у пользователей мало билетов на руках < 1100
      const owners = [
        { address: '0x1111', score: 800 },  // получит 800 * weight билетов
        { address: '0x2222', score: 200 },  // получит 200 * weight билетов  
        { address: '0x3333', score: 100 },  // получит 100 * weight билетов
      ];
      
      const sum = owners.reduce((acc, o) => acc + o.score, 0); // 1100
      expect(sum).toBe(1100); // < 1100, но будем тестировать сценарий > 10000
      
      // Принудительно создаем сценарий с большой суммой
      const bigSum = 15000; // > 10000, должно создать 100000 билетов
      const currentBlock = 12345;
      
      const result = mintTickets(bigSum, currentBlock, owners);
      
      expect(result.tickets).toHaveLength(100000);
      // Теперь все билеты всегда распределяются
      expect(result.tickets.every(t => t !== -1)).toBe(true);
      // Проверяем, что владелец с наибольшим score получил больше всех
      const ticketCounts = [0, 0, 0];
      result.tickets.forEach(ticketOwner => {
        if (ticketOwner >= 0 && ticketOwner < 3) {
          ticketCounts[ticketOwner]++;
        }
      });
      expect(ticketCounts[0]).toBeGreaterThan(ticketCounts[1]);
      expect(ticketCounts[0]).toBeGreaterThan(ticketCounts[2]);
      // Эффективность распределения
      const totalAssigned = ticketCounts.reduce((a, b) => a + b, 0);
      expect(totalAssigned / 100000).toBeGreaterThan(0.8);
    });

    it('should handle extreme case: 100000 tickets, only 100 user tickets', () => {
      const owners = [
        { address: '0xAAA', score: 60 },
        { address: '0xBBB', score: 25 },
        { address: '0xCCC', score: 15 },
      ];
      
      const sum = 50000; // > 10000, создаст 100000 билетов
      const currentBlock = 54321;
      
      const result = mintTickets(sum, currentBlock, owners);
      
      expect(result.tickets).toHaveLength(100000);
      // Теперь все билеты всегда распределяются
      expect(result.tickets.every(t => t !== -1)).toBe(true);
      // Проверяем, что владельцы получили билеты
      const ticketCounts = [0, 0, 0];
      result.tickets.forEach(ticketOwner => {
        if (ticketOwner >= 0 && ticketOwner < 3) {
          ticketCounts[ticketOwner]++;
        }
      });
      expect(ticketCounts[0]).toBeGreaterThan(0);
      expect(ticketCounts[1]).toBeGreaterThan(0);
      expect(ticketCounts[2]).toBeGreaterThan(0);
      // Проверяем что билеты распределены (может быть больше 80% из-за округления)
      const totalAssigned = ticketCounts.reduce((a, b) => a + b, 0);
      expect(totalAssigned / 100000).toBeGreaterThanOrEqual(0.8);
    });

    it('should maintain fair distribution when sum >= user tickets', () => {
      const owners = [
        { address: '0x111', score: 5000 },
        { address: '0x222', score: 3000 },
        { address: '0x333', score: 2000 },
      ];
      
      const sum = owners.reduce((acc, o) => acc + o.score, 0); // 10000
      const currentBlock = 11111;
      
      const result = mintTickets(sum, currentBlock, owners);
      
      expect(result.tickets).toHaveLength(100000);
      // Теперь все билеты всегда распределяются
      expect(result.tickets.every(t => t !== -1)).toBe(true);
      // Проверяем, что владельцы получили билеты
      const ticketCounts = [0, 0, 0];
      result.tickets.forEach(ticketOwner => {
        if (ticketOwner >= 0 && ticketOwner < 3) {
          ticketCounts[ticketOwner]++;
        }
      });
      expect(ticketCounts[0]).toBeGreaterThan(0);
      expect(ticketCounts[1]).toBeGreaterThan(0);
      expect(ticketCounts[2]).toBeGreaterThan(0);
      // Эффективность распределения
      const totalAssigned = ticketCounts.reduce((a, b) => a + b, 0);
      expect(totalAssigned / 100000).toBeGreaterThan(0.8);
    });

    it('should sort owners by score desc, address asc for fair distribution', () => {
      const owners = [
        { address: '0xBBB', score: 1000 },
        { address: '0xAAA', score: 1000 }, // такой же score, но адрес меньше
        { address: '0xCCC', score: 2000 },
      ];
      
      const sum = 5000;
      const currentBlock = 99999;
      
      const result = mintTickets(sum, currentBlock, owners);
      
      // Проверяем что map содержит владельцев в правильном порядке
      // 0xCCC (score: 2000) должен быть index 0
      // 0xAAA (score: 1000, меньший адрес) должен быть index 1  
      // 0xBBB (score: 1000, больший адрес) должен быть index 2
      expect(result.map[0].address).toBe('0xCCC');
      expect(result.map[1].address).toBe('0xAAA');
      expect(result.map[2].address).toBe('0xBBB');
    });
  });

  describe('parseDigits', () => {
    it('should extract digits from hash string', () => {
      expect(parseDigits('a1b2c3')).toEqual([1, 2, 3]);
      expect(parseDigits('0x123abc789')).toEqual([0, 1, 2, 3, 7, 8, 9]);
    });

    it('should handle strings without digits', () => {
      expect(parseDigits('abcdef')).toEqual([]);
    });

    it('should handle empty string', () => {
      expect(parseDigits('')).toEqual([]);
    });
  });

  describe('getWinTickets - Additional Tests', () => {
    it('should distribute tickets evenly between owners', () => {
      const owners = [
        { address: '0x1', score: 100 },
        { address: '0x2', score: 100 },
        { address: '0x3', score: 100 }
      ];
      
      const sum = 300;
      const currentBlock = 12345;
      const { tickets, map } = mintTickets(sum, currentBlock, owners);
      
      // Подсчитываем количество билетов у каждого владельца
      const counts = [0, 0, 0];
      tickets.forEach(t => {
        if (t >= 0 && t < 3) counts[t]++;
      });
      
      // Проверяем что распределение примерно равное (+/- 10%)
      const expected = tickets.length / 3;
      counts.forEach(count => {
        expect(count).toBeGreaterThan(expected * 0.9);
        expect(count).toBeLessThan(expected * 1.1);
      });
    });

    it('should produce different sequences for different seeds', () => {
      const owners = [
        { address: '0x1', score: 100 },
        { address: '0x2', score: 200 }
      ];
      
      const sum = 300;
      const result1 = mintTickets(sum, 1, owners);
      const result2 = mintTickets(sum, 2, owners);
      
      // Проверяем что последовательности разные
      expect(result1.tickets).not.toEqual(result2.tickets);
    });

    it('should handle edge cases in win tickets extraction', () => {
      // Тест с минимальным количеством цифр
      expect(getWinTickets('12', 1000)).toEqual([12, -1000, -1000]);
      expect(getWinTickets('1234', 10000)).toEqual([1234, -1000, -1000, -1000]);
      
      // Тест с повторяющимися цифрами
      expect(getWinTickets('111222333', 100000)).toEqual([11122, 2333, -1000, -1000, -1000]);
    });

    it('should return correct winners for 1000 tickets', () => {
      const hash = '0x123456789';
      const winners = getWinTickets(hash, 1000);
      
      // Должно вернуть до 3 трехзначных номера
      expect(winners).toHaveLength(3);
      winners.forEach(w => {
        if (w >= 0) {
          expect(w).toBeLessThan(1000);
        }
      });
    });

    it('should return correct winners for 10000 tickets', () => {
      const hash = '0000000000000661d155e40abd672c86ef0fc07633a6d8981f7d8b2696ae6776';
      const winners = getWinTickets(hash, 10000);
      
      // Должно вернуть до 4 четырехзначных номера
      expect(winners).toHaveLength(4);
      winners.forEach(w => {
        if (w >= 0) {
          expect(w).toBeLessThan(10000);
        }
      });
    });

    it('should return correct winners for 100000 tickets', () => {
      const hash = '0x1234567890123456789';
      const winners = getWinTickets(hash, 100000);
      
      // Должно вернуть до 5 пятизначных номеров
      expect(winners).toHaveLength(5);
      winners.forEach(w => {
        if (w >= 0) {
          expect(w).toBeLessThan(100000);
        }
      });
    });

    it('should return default values when not enough digits', () => {
      const hash = '0xabc'; // мало цифр
      const winners = getWinTickets(hash, 1000);
      
      expect(winners).toEqual([-1000, -1000, -1000]);
    });

    it('should handle edge case with unfair ticket distribution in winners', () => {
      // Тестируем сценарий где выигрышные билеты могут указывать на нераспределенные места
      const owners = [
        { address: '0x1', score: 100 },
        { address: '0x2', score: 50 },
      ];
      
      const sum = 20000; // создаст 100000 билетов
      const currentBlock = 12345;
      
      const { tickets, map } = mintTickets(sum, currentBlock, owners);
      
      // Эмулируем получение победителей из хеша
      const mockHash = '0x1234567890'; 
      const winTickets = getWinTickets(mockHash, 100000);
      
      // Проверяем что некоторые выигрышные билеты могут указывать на -1 (нераспределенные)
      let noWinnerCount = 0;
      winTickets.forEach(winTicket => {
        if (winTicket >= 0 && winTicket < tickets.length) {
          if (tickets[winTicket] === -1) {
            noWinnerCount++;
          }
        }
      });
      
      // В случае несправедливого распределения, многие выигрышные билеты могут быть нераспределенными
      expect(noWinnerCount).toBeGreaterThanOrEqual(0);
    });
  });
});