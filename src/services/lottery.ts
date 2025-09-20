import crypto from 'node:crypto';

export function getTicketCount(sum: number): number {
  if (sum >= 10000) return 100000;
  if (sum >= 1000) return 10000;
  return 1000;
}

export function getTicketWeight(sum: number): number {
  const maxTickets = getTicketCount(sum);
  const target = maxTickets * 0.8; // 80% от максимального количества
  return sum >= target ? 1 : target / sum;
}

// Простая детерминированная генерация псевдослучайной последовательности по seed
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSequence(sum: number, currentBlock: number, size: number): number[] {
  let dataClone = sum;
  const w = getTicketWeight(sum);
  if (w === 1) {
    dataClone = Math.floor(getTicketCount(sum) * 0.8);
  }
  const key = `${dataClone}${currentBlock}`;
  const h = crypto.createHash('sha256').update(key).digest();
  const seed = h.readUInt32BE(0);
  const rand = mulberry32(seed);
  const seq = Array.from({ length: size }, (_, i) => i);
  // Fisher–Yates
  for (let i = seq.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [seq[i], seq[j]] = [seq[j], seq[i]];
  }
  return seq;
}

export function mintTickets(sum: number, currentBlock: number, owners: Array<{ address: string; score: number }>): { tickets: number[]; map: Record<number, { address: string }> } {
  const count = getTicketCount(sum);
  if (!owners || owners.length === 0) {
    return { tickets: Array(count).fill(-1), map: {} };
  }
  // Оставляем только владельцев с положительным score
  const filteredOwners = owners.filter(o => typeof o.score === 'number' && o.score > 0);
  if (filteredOwners.length === 0) {
    return { tickets: Array(count).fill(-1), map: {} };
  }
  const weight = getTicketWeight(sum);
  const tickets = Array<number>(count).fill(-1);
  const sequence = generateSequence(sum, currentBlock, count);
  const colors: Record<number, { address: string }> = {};
  let j = 0;
  filteredOwners
    .slice()
    .sort((a, b) => b.score - a.score || a.address.localeCompare(b.address))
    .forEach((o, i) => {
      colors[i] = { address: o.address };
      const allot = Math.floor(weight * o.score);
      if (allot <= 0) {
        return;
      }
      for (let k = 0; k < allot; k++) {
        if (j < sequence.length) {
          const pos = sequence[j];
          if (pos >= 0 && pos < tickets.length) tickets[pos] = i;
          j++;
        }
      }
    });
  // Распределяем оставшиеся билеты между участниками пропорционально их долям
  if (filteredOwners.length > 0 && tickets.includes(-1)) {
    const totalAssigned = tickets.filter(t => t !== -1).length;
    const remaining = tickets.length - totalAssigned;
    const totalScore = filteredOwners.reduce((sum, o) => sum + o.score, 0);
    
    filteredOwners.forEach((o, idx) => {
      const share = o.score / totalScore;
      const additional = Math.floor(remaining * share);
      for (let i = 0; i < additional && j < sequence.length; j++) {
        const pos = sequence[j];
        if (pos >= 0 && pos < tickets.length) tickets[pos] = idx;
      }
    });
  }
  return { tickets, map: colors };
}

//Отметает буквы из хеша
export function parseDigits(h: string): number[] {
  const digits = Array.from(h).map((c) => (c >= '0' && c <= '9' ? Number(c) : -1)).filter((n) => n >= 0);
  // Если нет ни одной цифры, вернуть []
  if (!/[0-9]/.test(h)) return [];
  return digits;
}

function getWinners(vec: number[], n: number): number[] {
  const groups: number[][] = [];
  for (let i = vec.length; i > 0; i -= n) {
    const start = Math.max(0, i - n);
    groups.push(vec.slice(start, i));
  }
  groups.reverse();
  const res = groups.map((g) => g.reduce((acc, d) => acc * 10 + d, 0));
  return res.reverse();
}

export function getWinTickets(hash: string, l: number): number[] {
  const digits = parseDigits(hash);
  let n = 3;
  if (l === 10000) n = 4;
  if (l === 100000) n = 5;
  if (digits.length < n) {
    return Array(n).fill(-1000);
  }
  const w = getWinners(digits, n);
  return w.length >= n ? w.slice(0, n) : Array(n).fill(-1000);
}


