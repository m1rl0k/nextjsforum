import { validateEnv } from '../lib/env';

describe('env validation in test mode', () => {
  it('provides defaults in test', () => {
    process.env.NODE_ENV = 'test';
    delete require.cache[require.resolve('../lib/env')];
    const env = validateEnv();
    expect(env.JWT_SECRET).toBeDefined();
    expect(env.DATABASE_URL).toBeDefined();
  });
});
