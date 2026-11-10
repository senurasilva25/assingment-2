import { afterEach, expect, it, vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ configured: true })),
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

async function configure(url, key = 'sb_publishable_test') {
  vi.resetModules();
  vi.stubEnv('VITE_SUPABASE_URL', url);
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', key);
  return import('../services/supabase');
}

it('accepts the public HTTPS project URL', async () => {
  const result = await configure('https://example.supabase.co');
  expect(result.configurationError).toBe('');
  expect(result.supabase).toEqual({ configured: true });
});

it('rejects private database URLs in browser configuration', async () => {
  const result = await configure(
    'postgresql://postgres:test@db.example.supabase.co:5432/postgres',
  );
  expect(result.supabase).toBeNull();
  expect(result.configurationError).toContain(
    'Keep PostgreSQL credentials in DATABASE_URL',
  );
  expect(result.configurationError).not.toContain('postgres:test');
});

it('rejects secret API keys in browser configuration', async () => {
  const result = await configure(
    'https://example.supabase.co',
    'sb_secret_test',
  );
  expect(result.supabase).toBeNull();
  expect(result.configurationError).toContain('Use a publishable key');
});
