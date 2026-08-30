import assert from 'node:assert/strict';
import test from 'node:test';
import { AppKeyService } from './app-key.service';

function createService(secret: string): AppKeyService {
  const config = { getOrThrow: (key: string) => (key === 'APP_SECRET' ? secret : undefined) };
  return new AppKeyService(config as never);
}

void test('derives deterministic 32-byte purpose-specific keys with HKDF-SHA256', () => {
  const service = createService('a'.repeat(48));
  const jwtKey = service.jwtKey();
  const ipHashKey = service.ipHashKey();

  assert.equal(jwtKey.length, 32);
  assert.equal(ipHashKey.length, 32);
  assert.deepEqual(jwtKey, service.jwtKey());
  assert.deepEqual(ipHashKey, service.ipHashKey());
  assert.notDeepEqual(jwtKey, ipHashKey);
});

void test('different root secrets derive different keys', () => {
  assert.notDeepEqual(createService('a'.repeat(48)).jwtKey(), createService('b'.repeat(48)).jwtKey());
});
