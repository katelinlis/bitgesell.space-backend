import { describe, it, expect } from '@jest/globals';
import { 
  getTicketCount, 
  getTicketWeight, 
  mintTickets, 
  getWinTickets
} from '../services/lottery';

/**
 * Специализированные тесты для случаев несправедливого распределения билетов
 * Фокус на сценариях где общее количество билетов > 10000, но у пользователей < 1100 билетов
 */
describe('Unfair Distribution Edge Cases', () => {
  
  describe('Critical Unfairness Scenarios', () => {
    /**
     * Сценарий 1: Один крупный владелец доминирует при высокой общей сумме
     */
    it('should demonstrate whale dominance in 100k ticket pool', () => {
      const owners = [
        { address: '0xWHALE', score: 8000 },    // доминирующий владелец
        { address: '0xSHRIMP1', score: 100 },   // мелкий владелец
        { address: '0xSHRIMP2', score: 50 },    // еще мельче
        { address: '0xSHRIMP3', score: 25 },    // минимальный
      ];
      
      const sum = 50000; // высокая сумма -> 100k билетов
      const currentBlock = 12345;
      
      const result = mintTickets(sum, currentBlock, owners);
      
      // Должно создать 100k билетов
      expect(result.tickets).toHaveLength(100000);
      
      const weight = getTicketWeight(sum); // 70000/50000 = 1.4
      
      // Подсчитываем билеты каждого владельца
      const ticketCounts = owners.map((_, index) => 
        result.tickets.filter(t => t === index).length
      );
      // Все билеты распределяются между валидными владельцами
      expect(result.tickets.every(t => t !== -1)).toBe(true);
      const totalAssigned = ticketCounts.reduce((a, b) => a + b, 0);
      expect(totalAssigned).toBe(result.tickets.length);
      // Кит должен получить подавляющее большинство билетов
      const whalePercentage = ticketCounts[0] / totalAssigned;
      expect(whalePercentage).toBeGreaterThan(0.95);
    });

    /**
     * Сценарий 2: Множество мелких владельцев против одного крупного
     */
    it('should show unfair advantage even with many small holders', () => {
      const owners = [
        { address: '0xBIG', score: 5000 },       // крупный владелец
        ...Array.from({ length: 20 }, (_, i) => ({  // 20 мелких владельцев
          address: `0xSMALL${i.toString().padStart(2, '0')}`,
          score: 50
        }))
      ];
      
      const sum = 25000; // высокая сумма
      const currentBlock = 54321;
      
      const result = mintTickets(sum, currentBlock, owners);
      
      const weight = getTicketWeight(sum); // 70000/25000 = 2.8
      
      // Подсчет билетов
      const bigHolderTickets = result.tickets.filter(t => t === 0).length;
      const smallHoldersTickets = result.tickets.filter(t => t > 0 && t < 21).length;
      
      const expectedBigTickets = Math.floor(weight * 5000);  // 14000
      const expectedSmallTickets = Math.floor(weight * 50);  // 140 каждый
      
  // Все билеты распределяются между валидными владельцами
  const totalAssigned = bigHolderTickets + smallHoldersTickets;
  expect(totalAssigned).toBe(result.tickets.length);
  // Один крупный владелец получает больше билетов чем все 20 мелких вместе
  expect(bigHolderTickets).toBeGreaterThan(smallHoldersTickets);
      
      console.log('Big vs many small scenario:');
      console.log(`Big holder: ${bigHolderTickets} tickets`);
      console.log(`20 small holders: ${smallHoldersTickets} tickets total (${expectedSmallTickets} each)`);
      console.log(`Advantage ratio: ${(bigHolderTickets / smallHoldersTickets).toFixed(2)}x`);
    });

    /**
     * Сценарий 3: Экстремальный случай - очень мало билетов у пользователей
     */
    it('should handle extreme case with minimal user tickets in 100k pool', () => {
      const owners = [
        { address: '0xONLY1', score: 200 },
        { address: '0xONLY2', score: 100 },
        { address: '0xONLY3', score: 50 },
      ];
      
      const sum = 100000; // экстремально высокая сумма
      const currentBlock = 99999;
      
      const result = mintTickets(sum, currentBlock, owners);
      
      expect(result.tickets).toHaveLength(100000);
      
      const weight = getTicketWeight(sum); // 1 (так как sum > 70000)
      
      const ticketCounts = owners.map((_, index) => 
        result.tickets.filter(t => t === index).length
      );
      
      // При весе 1, каждый получает билетов равно своему score
  // Все билеты распределяются между валидными владельцами
  const totalAssigned = ticketCounts.reduce((a, b) => a + b, 0);
  expect(totalAssigned).toBe(result.tickets.length);
  expect(result.tickets.every(t => t !== -1)).toBe(true);
  expect(totalAssigned / 100000).toBeGreaterThan(0.8); // более 80% распределено
  console.log('Extreme minimal distribution:');
  console.log(`Total assigned: ${totalAssigned} (${(totalAssigned/100000*100).toFixed(2)}%)`);
    });
  });

  describe('Winner Selection in Unfair Scenarios', () => {
    /**
     * Тест показывает как несправедливое распределение влияет на выбор победителей
     */
    it('should show winner bias due to unfair ticket distribution', () => {
      const owners = [
        { address: '0xDOMINANT', score: 7000 },
        { address: '0xWEAK1', score: 200 },
        { address: '0xWEAK2', score: 100 },
      ];
      
      const sum = 30000;
      const currentBlock = 11111;
      
      const { tickets, map } = mintTickets(sum, currentBlock, owners);
      
      // Эмулируем различные хеши блоков для статистического анализа
      const hashes = [
        '0x1234567890',
        '0x9876543210',
        '0x1111222233',
        '0x4444555566',
        '0x7777888899'
      ];
      
      let dominantWins = 0;
      let noWinnerCount = 0;
      let totalWins = 0;
      
      hashes.forEach(hash => {
        const winTickets = getWinTickets(hash, 100000);
        
        winTickets.forEach(winTicket => {
          if (winTicket >= 0 && winTicket < tickets.length) {
            const ownerIndex = tickets[winTicket];
            if (ownerIndex === -1) {
              noWinnerCount++;
            } else if (ownerIndex === 0) { // доминирующий владелец
              dominantWins++;
              totalWins++;
            } else {
              totalWins++;
            }
          }
        });
      });
      
      // Доминирующий владелец должен выигрывать в подавляющем большинстве случаев
      if (totalWins > 0) {
        const dominantWinRate = dominantWins / totalWins;
        expect(dominantWinRate).toBeGreaterThan(0.8); // более 80% побед
        
        console.log('Winner bias analysis:');
        console.log(`Dominant holder wins: ${dominantWins}/${totalWins} (${(dominantWinRate*100).toFixed(1)}%)`);
        console.log(`No winner cases: ${noWinnerCount}`);
      }
      
  // Теперь все билеты всегда распределяются, невалидных победителей быть не должно
  expect(noWinnerCount).toBe(0);
    });

    /**
     * Демонстрация того, как нераспределенные билеты влияют на результат лотереи
     */
    it('should demonstrate impact of unassigned tickets on lottery outcomes', () => {
      const scenarios = [
        {
          name: 'Fair distribution',
          owners: [{ address: '0xFAIR', score: 10000 }],
          sum: 10000 // точно 10k -> все билеты распределены
        },
        {
          name: 'Unfair distribution', 
          owners: [{ address: '0xUNFAIR', score: 1000 }],
          sum: 50000 // 50k -> много нераспределенных
        }
      ];
      
      scenarios.forEach(scenario => {
        const { tickets } = mintTickets(scenario.sum, 12345, scenario.owners);
        const unassigned = tickets.filter(t => t === -1).length;
        const assigned = tickets.length - unassigned;
        
        // Моделируем выбор победителей
        const mockWinTickets = [12345, 67890, 11111, 22222, 33333]; // случайные номера
        
        let validWinners = 0;
        let invalidWinners = 0;
        
        mockWinTickets.forEach(ticket => {
          if (ticket < tickets.length) {
            if (tickets[ticket] >= 0) {
              validWinners++;
            } else {
              invalidWinners++;
            }
          }
        });
        
        console.log(`\n${scenario.name}:`);
        console.log(`Assigned: ${assigned}/${tickets.length} (${(assigned/tickets.length*100).toFixed(1)}%)`);
        console.log(`Valid winners: ${validWinners}/${mockWinTickets.length}`);
        console.log(`Invalid (no winner): ${invalidWinners}/${mockWinTickets.length}`);
        
        if (scenario.name === 'Fair distribution') {
          expect(assigned / tickets.length).toBeGreaterThan(0.8); // более 80% распределено
        } else {
          // Теперь все билеты всегда распределяются, невалидных победителей быть не должно
          expect(assigned / tickets.length).toBeGreaterThan(0.8);
          expect(invalidWinners).toBe(0);
        }
      });
    });
  });

  describe('Mathematical Fairness Analysis', () => {
    /**
     * Анализ математической справедливости распределения
     */
    it('should analyze fairness coefficient in different scenarios', () => {
      const testCases = [
        {
          name: 'Equal distribution',
          owners: Array.from({ length: 10 }, (_, i) => ({
            address: `0x${i}`,
            score: 1000
          })),
          sum: 10000
        },
        {
          name: 'Moderate inequality',
          owners: [
            { address: '0x1', score: 5000 },
            { address: '0x2', score: 2500 },
            { address: '0x3', score: 2500 }
          ],
          sum: 10000
        },
        {
          name: 'Extreme inequality (unfair)',
          owners: [
            { address: '0xWHALE', score: 9000 },
            { address: '0xSMALL', score: 1000 }
          ],
          sum: 50000 // создаст ситуацию несправедливости
        }
      ];
      
      testCases.forEach(testCase => {
        const { tickets } = mintTickets(testCase.sum, 12345, testCase.owners);
        
        // Подсчет билетов каждого владельца
        const ticketCounts = testCase.owners.map((_, index) => 
          tickets.filter(t => t === index).length
        );
        
        const totalAssigned = ticketCounts.reduce((a, b) => a + b, 0);
        const totalScore = testCase.owners.reduce((acc, o) => acc + o.score, 0);
        
        // Расчет коэффициента справедливости (как близко к идеальному распределению)
        let fairnessCoefficient = 0;
        if (totalAssigned > 0) {
          const deviations = testCase.owners.map((owner, index) => {
            const actualPercentage = ticketCounts[index] / totalAssigned;
            const expectedPercentage = owner.score / totalScore;
            return Math.abs(actualPercentage - expectedPercentage);
          });
          
          fairnessCoefficient = 1 - (deviations.reduce((a, b) => a + b, 0) / deviations.length);
        }
        
        console.log(`\n${testCase.name}:`);
        console.log(`Fairness coefficient: ${fairnessCoefficient.toFixed(3)}`);
        console.log(`Assigned tickets: ${totalAssigned}/${tickets.length}`);
        
        testCase.owners.forEach((owner, index) => {
          const percentage = totalAssigned > 0 ? (ticketCounts[index] / totalAssigned * 100).toFixed(1) : '0';
          const expectedPercentage = (owner.score / totalScore * 100).toFixed(1);
          console.log(`${owner.address}: ${ticketCounts[index]} tickets (${percentage}%, expected ${expectedPercentage}%)`);
        });
        
        // Проверки справедливости
  // Теперь все билеты всегда распределяются, проверяем только сумму
  expect(totalAssigned).toBe(tickets.length);
      });
    });
  });
});