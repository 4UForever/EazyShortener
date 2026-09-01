import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { ApiTokenService } from './api-token.service';

function createHarness(prefix = 'ez_live_', tokenBytes = 32) {
  const rows: Array<{
    id: string;
    userId: string;
    name: string;
    tokenPrefix: string;
    tokenHash: string;
    expiresAt: Date | null;
  }> = [];
  let sequence = 0;

  const prisma = {
    apiToken: {
      create: ({ data }: { data: Omit<(typeof rows)[number], 'id'> }) => {
        const row = { id: `token-${++sequence}`, ...data };
        rows.push(row);
        return Promise.resolve(row);
      },
    },
  };
  const config = {
    getOrThrow: (key: string) => {
      if (key === 'API_TOKEN_PREFIX') return prefix;
      throw new Error(`Unexpected config key: ${key}`);
    },
    get: (key: string) => (key === 'API_TOKEN_BYTES' ? tokenBytes : undefined),
  };

  return { service: new ApiTokenService(prisma as never, config as never), rows };
}

void test('issues ez_live_ tokens while persisting only display prefix and hash', async () => {
  const { service, rows } = createHarness();
  const expiresAt = new Date('2026-10-01T00:00:00.000Z');
  const issued = await service.issue({ userId: 'user-1', name: 'Primary', expiresAt });

  assert.match(issued.rawToken, /^ez_live_[A-Za-z0-9_-]+$/);
  assert.equal(Buffer.from(issued.rawToken.slice('ez_live_'.length), 'base64url').length, 32);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.tokenHash, createHash('sha256').update(issued.rawToken).digest('hex'));
  assert.equal(rows[0]?.tokenPrefix, issued.rawToken.slice(0, 'ez_live_'.length + 8));
  assert.equal(rows[0]?.expiresAt, expiresAt);
  assert.equal(Object.values(rows[0] ?? {}).includes(issued.rawToken), false);
});

void test('returns a fresh raw token for each issuance', async () => {
  const { service } = createHarness();
  const first = await service.issue({ userId: 'user-1', name: 'First' });
  const second = await service.issue({ userId: 'user-1', name: 'Second' });

  assert.notEqual(first.rawToken, second.rawToken);
  assert.notEqual(first.tokenPrefix, second.tokenPrefix);
});

void test('rejects a configured prefix that does not match the API token contract', async () => {
  const { service, rows } = createHarness('wrong_');

  await assert.rejects(service.issue({ userId: 'user-1', name: 'Invalid' }), /API_TOKEN_PREFIX must be ez_live_/);
  assert.equal(rows.length, 0);
});
