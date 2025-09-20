// Простой логгер для приложения
// Поддерживает разные уровни логирования

const colors = {
  info: '\x1b[36m', // cyan
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
  reset: '\x1b[0m' // reset color
};

function getTimestamp(): string {
  return new Date().toISOString();
}

function log(level: 'info' | 'warn' | 'error', message: string): void {
  const color = colors[level];
  console.log(`${color}[${getTimestamp()}] [${level.toUpperCase()}]${colors.reset} ${message}`);
}

export const logger = {
  info: (message: string) => log('info', message),
  warn: (message: string) => log('warn', message),
  error: (message: string) => log('error', message)
};