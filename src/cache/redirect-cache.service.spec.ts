import assert from 'node:assert/strict';
import test from 'node:test';
import { RedirectCacheService } from './redirect-cache.service';

class RedisMock {
  sets: Array<{ key: string; ttl: number; value: string }> = [];
  values = new Map<string, string>();
  deleted: string[] = [];

  get(key: string): Promise<string | null> {
    return Promise.resolve(this.values.get(key) ?? null);
  }

  setEx(key: string, ttl: number, value: string): Promise<void> {
    this.sets.push({ key, ttl, value });
    return Promise.resolve();
  }

  del(key: string): Promise<void> {
    this.deleted.push(key);
    return Promise.resolve();
  }
}

class ConfigMock {
  constructor(private readonly maxTtl: number) {}
  get<T>(_key: string): T {
    return this.maxTtl as T;
  }
}

void test('permanent links use configured max TTL', async () => {
  const redis = new RedisMock();
  const service = new RedirectCacheService(redis as never, new ConfigMock(3600) as never);
  await service.set('abc', 'https://example.com', null, new Date('2026-09-04T00:00:00Z'));
  assert.deepEqual(redis.sets[0], { key: 'redirect:abc', ttl: 3600, value: 'https://example.com' });
});

void test('expiring link TTL never outlives expiration', async () => {
  const redis = new RedisMock();
  const service = new RedirectCacheService(redis as never, new ConfigMock(3600) as never);
  const now = new Date('2026-09-04T00:00:00Z');
  await service.set('abc', 'https://example.com', new Date(now.getTime() + 90_500), now);
  assert.equal(redis.sets[0]?.ttl, 90);
});

void test('links with less than one second remaining are not cached', async () => {
  const redis = new RedisMock();
  const service = new RedirectCacheService(redis as never, new ConfigMock(3600) as never);
  const now = new Date('2026-09-04T00:00:00Z');
  await service.set('abc', 'https://example.com', new Date(now.getTime() + 500), now);
  assert.equal(redis.sets.length, 0);
});
