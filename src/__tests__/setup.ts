import { beforeAll, afterAll } from '@jest/globals';

beforeAll(async () => {
  // Мокаем внешние зависимости
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  // Очистка после тестов
});