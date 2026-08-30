import assert from 'node:assert/strict';
import test from 'node:test';
import { UserStatus } from '@prisma/client';
import { AppKeyService } from '../security/app-key.service';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';

const rootSecret = 's'.repeat(48);
const config = {
  get: (key: string) => (key === 'JWT_ACCESS_TTL_SECONDS' ? 3600 : undefined),
  getOrThrow: (key: string) => (key === 'APP_SECRET' ? rootSecret : undefined),
};

void test('signs with the derived JWT key and enforces configured TTL', () => {
  const jwt = new JwtService(config as never, new AppKeyService(config as never));
  const now = Date.parse('2026-08-30T00:00:00.000Z');
  const token = jwt.sign({ id: 'user-1', email: 'user@example.com' }, now);

  assert.equal(jwt.verify(token, now + 3_599_000).sub, 'user-1');
  assert.throws(() => jwt.verify(token, now + 3_600_000), /expired JWT/);
  assert.equal(token.includes(rootSecret), false);
});

void test('login allows only ACTIVE email-verified users with a matching password', async () => {
  let currentUser = {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: 'hash',
    status: UserStatus.ACTIVE as UserStatus,
    emailVerifiedAt: new Date(),
  };
  const prisma = { user: { findUnique: () => Promise.resolve(currentUser) } };
  const passwords = { verify: (_hash: string, password: string) => Promise.resolve(password === 'correct-password') };
  const jwt = { sign: () => 'signed-token' };
  const auth = new AuthService(prisma as never, passwords as never, jwt as never);

  assert.deepEqual(await auth.login({ email: ' USER@example.com ', password: 'correct-password' }), { accessToken: 'signed-token' });
  await assert.rejects(auth.login({ email: 'user@example.com', password: 'wrong-password' }), /Invalid email or password/);

  currentUser = { ...currentUser, status: UserStatus.PENDING };
  await assert.rejects(auth.login({ email: 'user@example.com', password: 'correct-password' }), /Invalid email or password/);

  currentUser = { ...currentUser, status: UserStatus.ACTIVE, emailVerifiedAt: null as never };
  await assert.rejects(auth.login({ email: 'user@example.com', password: 'correct-password' }), /Invalid email or password/);
});
