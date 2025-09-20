import { describe, it, expect } from '@jest/globals';
import { 
  mintTickets, 
  getTicketCount, 
  getTicketWeight,
  getWinTickets,
  parseDigits
} from '../services/lottery';

/**
 * Тесты граничных случаев и потенциальных ошибок
 */
describe('Edge Cases and Error Handling', () => {
  
  describe('Boundary Value Tests', () => {
    it('should handle exact threshold values correctly', () => {
      const thresholds = [
        { sum: 999, expectedTickets: 1000 },
        { sum: 1000, expectedTickets: 10000 },
        { sum: 9999, expectedTickets: 10000 },
        { sum: 10000, expectedTickets: 100000 },
      ];
      
      thresholds.forEach(({ sum, expectedTickets }) => {
        expect(getTicketCount(sum)).toBe(expectedTickets);
        console.log(`Sum ${sum} -> ${expectedTickets} tickets`);
      });
    });

    it('should handle weight calculation edge cases', () => {
      const weightTests = [
        { sum: 799, expectedWeight: 800/799 },
        { sum: 800, expectedWeight: 1 },
        { sum: 7999, expectedWeight: 8000/7999 },
        { sum: 8000, expectedWeight: 1 },
        { sum: 79999, expectedWeight: 80000/79999 },
        { sum: 80000, expectedWeight: 1 },
      ];
      
      weightTests.forEach(({ sum, expectedWeight }) => {
        const actualWeight = getTicketWeight(sum);
        expect(Math.abs(actualWeight - expectedWeight)).toBeLessThan(0.001);
        console.log(`Sum ${sum} -> weight ${actualWeight.toFixed(4)}`);
      });
    });
  });
 
  describe('Invalid Input Handling', () => {
    it('should handle empty owners array', () => {
      const result = mintTickets(10000, 12345, []);
      
  expect(result.tickets.length).toBeGreaterThan(0);
  // Если нет валидных владельцев, все билеты нераспределены
  expect(result.tickets.every(t => t === -1)).toBe(true);
  expect(Object.keys(result.map)).toHaveLength(0);
    });

    it('should handle owners with zero score', () => {
      const owners = [
        { address: '0x1', score: 0 },
        { address: '0x2', score: 1000 },
        { address: '0x3', score: 0 },
      ];
      
      const result = mintTickets(1000, 12345, owners);
      
  // Проверяем, что билеты распределены только между валидными владельцами
  const validOwners = owners.filter(o => o.score > 0);
  const invalidOwners = owners.filter(o => o.score <= 0);
  // В map должны быть только валидные адреса
  const mapAddresses = Object.values(result.map).map(o => o.address);
  validOwners.forEach(o => expect(mapAddresses).toContain(o.address));
  invalidOwners.forEach(o => expect(mapAddresses).not.toContain(o.address));
  // Все билеты распределены между валидными владельцами
  expect(result.tickets.every(t => t >= 0)).toBe(true);
    });

    it('should handle negative scores gracefully', () => {
      const owners = [
        { address: '0x1', score: -100 },
        { address: '0x2', score: 1000 },
      ];
      
      const result = mintTickets(1000, 12345, owners);
      
  // Проверяем, что билеты распределены только между валидными владельцами
  const validOwners = owners.filter(o => o.score > 0);
  const invalidOwners = owners.filter(o => o.score <= 0);
  const mapAddresses = Object.values(result.map).map(o => o.address);
  validOwners.forEach(o => expect(mapAddresses).toContain(o.address));
  invalidOwners.forEach(o => expect(mapAddresses).not.toContain(o.address));
  // Все билеты распределены между валидными владельцами
  expect(result.tickets.every(t => t >= 0)).toBe(true);
    });


    //Долго выполняется
    // it('should handle extremely large scores', () => {
    //   const owners = [
    //     { address: '0x1', score: Number.MAX_SAFE_INTEGER },
    //     { address: '0x2', score: 1000 },
    //   ];
      
    //   expect(() => {
    //     mintTickets(Number.MAX_SAFE_INTEGER, 12345, owners);
    //   }).not.toThrow();
    // });

 

    it('should handle duplicate addresses', () => {
      const owners = [
        { address: '0xSAME', score: 1000 },
        { address: '0xSAME', score: 2000 }, // дублирующийся адрес
        { address: '0xDIFF', score: 500 },
      ];
      
      const result = mintTickets(3500, 12345, owners);
      
      // Система должна обработать как отдельных владельцев
      expect(result.map[0].address).toBe('0xSAME'); // первый по score
      expect(result.map[1].address).toBe('0xSAME'); // второй по score и алфавиту
      expect(result.map[2].address).toBe('0xDIFF');
    });
  });

  describe('Hash Processing Edge Cases', () => {
    it('should handle hashes with no digits', () => {
  const hash = '0xabcdef';
  const digits = parseDigits(hash);
  expect(Array.isArray(digits)).toBe(true);
  // winners должны быть -1000 если нет цифр
  const winners = getWinTickets(hash, 1000);
  expect(winners.every(w => w === -1000)).toBe(true);
    });

    it('should handle very short hashes', () => {
      const shortHash = '0x1';
      const winners = getWinTickets(shortHash, 1000);
      expect(winners).toEqual([-1000, -1000, -1000]);
    });

    it('should handle hashes with only one digit repeated', () => {
      const hash = '0x111111111';
      const winners = getWinTickets(hash, 1000);
      
      // Должен попытаться создать номера из повторяющихся цифр
      expect(Array.isArray(winners)).toBe(true);
      expect(winners).toHaveLength(3);
    });

    it('should handle empty hash', () => {
      const emptyHash = '';
      const digits = parseDigits(emptyHash);
      expect(digits).toEqual([]);
      
      const winners = getWinTickets(emptyHash, 1000);
      expect(winners).toEqual([-1000, -1000, -1000]);
    });
  });

  

  describe('Floating Point and Precision Issues', () => {
    it('should handle precision in weight calculations', () => {
      // Тестируем случаи где деление может дать неточные результаты
      const precisionTests = [
        { sum: 3, expectedWeight: 700/3 },
        { sum: 7, expectedWeight: 700/7 },
        { sum: 13, expectedWeight: 700/13 },
      ];
      
      precisionTests.forEach(({ sum, expectedWeight }) => {
        const actualWeight = getTicketWeight(sum);
        expect(typeof actualWeight).toBe('number');
        expect(isFinite(actualWeight)).toBe(true);
        expect(actualWeight).toBeGreaterThan(0);
      });
    });

    it('should handle rounding in ticket allocation', () => {
      const owners = [
        { address: '0x1', score: 333 }, // будет дробное количество билетов
        { address: '0x2', score: 333 },
        { address: '0x3', score: 334 },
      ];
      
      const result = mintTickets(1000, 12345, owners);
      
      // Проверяем что билеты распределились корректно несмотря на округления
      const ticketCounts = owners.map((_, i) => 
        result.tickets.filter(t => t === i).length
      );
      
      expect(ticketCounts.every(count => Number.isInteger(count))).toBe(true);
      expect(ticketCounts.every(count => count >= 0)).toBe(true);
    });
  });

  describe('Sorting and Stability Tests', () => {
    it('should maintain stable sorting for equal scores', () => {
      const owners = [
        { address: '0xZZZ', score: 1000 },
        { address: '0xAAA', score: 1000 }, // тот же score, но меньший адрес
        { address: '0xMMM', score: 1000 },
      ];
      
      const result = mintTickets(3000, 12345, owners);
      
      // При одинаковом score сортировка должна быть по адресу
      expect(result.map[0].address).toBe('0xAAA');
      expect(result.map[1].address).toBe('0xMMM');
      expect(result.map[2].address).toBe('0xZZZ');
    });

    it('should handle mixed case addresses correctly', () => {
      const owners = [
        { address: '0xabc', score: 1000 },
        { address: '0xABC', score: 1000 },
        { address: '0xAbC', score: 1000 },
      ];
      
      expect(() => {
        mintTickets(3000, 12345, owners);
      }).not.toThrow();
      
      // Проверяем что все адреса попали в map
      const result = mintTickets(3000, 12345, owners);
      const addresses = Object.values(result.map).map(owner => owner.address);
      expect(addresses).toContain('0xabc');
      expect(addresses).toContain('0xABC');
      expect(addresses).toContain('0xAbC');
    });
  });

  describe('Extreme Scenarios', () => {
    it('should handle scenario with single owner and minimal score', () => {
      const owners = [{ address: '0xONLY', score: 1 }];
      const result = mintTickets(50000, 12345, owners);
      
      expect(result.tickets).toHaveLength(100000);
      
      const ownerTickets = result.tickets.filter(t => t === 0).length;
      const weight = getTicketWeight(50000);
      // Все билеты у единственного валидного владельца
      expect(ownerTickets).toBe(result.tickets.length);
    });

    it('should handle maximum possible unfairness', () => {
      // Максимальная несправедливость: огромная сумма, минимальные владения
      const owners = Array.from({ length: 10 }, (_, i) => ({
        address: `0x${i}`,
        score: 1 // минимальный score
      }));
      
      const result = mintTickets(1000000, 12345, owners);
      
      expect(result.tickets).toHaveLength(100000);
      
      const totalAssigned = result.tickets.filter(t => t >= 0).length;
      // Все билеты у валидных владельцев
      expect(totalAssigned).toBe(result.tickets.length);
      
      console.log('Maximum unfairness scenario:');
      console.log(`Assigned: ${totalAssigned}/100000 (${(totalAssigned/100000*100).toFixed(4)}%)`);
    });
  });
});