 
// Моки для обработчиков
export const mockHandlers = {
  getInfo: jest.fn(),
  getBlockchainData: jest.fn(),
  getRound: jest.fn(),
  getTicketsCount: jest.fn(),
  getTickets: jest.fn(),
  getLastWinners: jest.fn(),
  getOwners: jest.fn(),
  getLuckyHash: jest.fn(),
  getLastTrade: jest.fn(),
  getPayment: jest.fn(),
  getWbgl: jest.fn(),
  getNftByAddress: jest.fn(),
  initDb: jest.fn(),
  seedInfoLotto: jest.fn(),
};

// Мок для ownersCache
export const mockOwnersCache = {
  listOwners: jest.fn(() => []),
  addOwner: jest.fn(),
  updateOwner: jest.fn(),
  removeOwner: jest.fn(),
  clear: jest.fn(),
};

// Мок для утилит
export const mockUtils = {
  getCurrentBlock: jest.fn(() => Promise.resolve(1000)),
  getLuckyBlock: jest.fn(() => Promise.resolve(1500)),
  getBlockHash: jest.fn(() => Promise.resolve('0x1234567890abcdef')),
};

// Мок для Snapshots
export const mockSnapshots = {
  getLatestSnapshot: jest.fn(() => null),
  loadSnapshot: jest.fn(() => Promise.resolve()),
  saveSnapshot: jest.fn(() => Promise.resolve()),
};