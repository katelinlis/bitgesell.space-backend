export type TokenLocal = {
  index: number;
  count: number;
  id: string;
  is_full: boolean;
  bracket: number;
  level: 'Common' | 'Special' | 'Rare' | 'Unique' | 'Legendary' | string;
};

const POINTS: Record<string, number> = {
  Common: 1,
  Special: 3,
  Rare: 7,
  Unique: 30,
  Legendary: 50,
};

// Порт мультипликаторов из Rust-логики с защитой индексов
export function multiplicator(tokens: TokenLocal[]): number[] {
  const multiply = new Array<number>(20).fill(1);
  let cur = 0;

  const has = (i: number) => i >= 0 && i < tokens.length && tokens[i].count > 0;

  // Common: индексы 0..3
  if (has(0) && has(1) && has(2) && has(3)) multiply[cur] = 1.5;
  cur += 1;

  // Common: индексы 4..7
  if (has(4) && has(5) && has(6) && has(7)) multiply[cur] = 1.5;
  cur += 1;

  // Special: группы по 3, начиная с 8 до 20 включительно (8..10, 11..13, 14..16, 17..19, 20..22)
  let i = 8;
  while (i <= 20) {
    if (has(i) && has(i + 1) && has(i + 2)) multiply[cur] = 2;
    i += 3;
    cur += 1;
  }

  // Rare: пары, начиная с 23 до 31 включительно (23..24, 25..26, 27..28, 29..30, 31..32)
  i = 23;
  while (i <= 31) {
    if (has(i) && has(i + 1)) multiply[cur] = 3;
    i += 2;
    cur += 1;
  }

  return multiply;
}

export function getPts(tokens: TokenLocal[]): number {
  const coef = multiplicator(tokens);
  let sum = 0;
  for (const t of tokens) {
    const point = POINTS[t.level] ?? 1;
    const idx = Math.max(0, Math.min(coef.length - 1, t.bracket));
    sum += coef[idx] * point * (t.count || 0);
  }
  return sum;
}

export function getPtsByGrade(tokens: TokenLocal[]): Record<string, number> {
  const grades = ['Common', 'Special', 'Rare', 'Unique', 'Legendary'];
  const scores: Record<string, number> = Object.fromEntries(grades.map(g => [g, 0]));
  const coef = multiplicator(tokens);
  for (const g of grades) {
    let pts = 0;
    for (const t of tokens) {
      if (t.level !== g) continue;
      const point = POINTS[t.level] ?? 1;
      const idx = Math.max(0, Math.min(coef.length - 1, t.bracket));
      pts += coef[idx] * point * (t.count || 0);
    }
    scores[g] = pts;
  }
  return scores;
}


