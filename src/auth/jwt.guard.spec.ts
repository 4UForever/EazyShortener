import assert from 'node:assert/strict';
import test from 'node:test';
import { UserStatus } from '@prisma/client';
import { AppKeyService } from '../security/app-key.service';
import { JwtGuard } from './jwt.guard';
import { JwtService } from './jwt.service';
import { JwtStrategy } from './jwt.strategy';

const config = {
  get: (key: string) => (key === 'JWT_ACCESS_TTL_SECONDS' ? 3600 : undefined),
  getOrThrow: (key: string) => {
    if (key === 'APP_SECRET') return 'g'.repeat(48);
    if (key === 'JWT_COOKIE_NAME') return 'eazy_session';
    throw new Error(`Unexpected config key: ${key}`);
  },
};

const activeUser = {
  id: 'user-guard',
  email: 'guard@example.com',
  passwordHash: 'hash',
  status: UserStatus.ACTIVE,
  emailVerifiedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createGuard() {
  const jwt = new JwtService(config as never, new AppKeyService(config as never));
  const prisma = { user: { findUnique: () => Promise.resolve(activeUser) } };
  const strategy = new JwtStrategy(jwt, prisma as never);
  return { jwt, guard: new JwtGuard(strategy, config as never) };
}

function contextFor(request: { headers: Record<string, string | undefined>; user?: unknown }) {
  return { switchToHttp: () => ({ getRequest: () => request }) } as never;
}

void test('resolves current user from a valid bearer JWT', async () => {
  const { jwt, guard } = createGuard();
  const token = jwt.sign({ id: activeUser.id, email: activeUser.email });
  const request: { headers: Record<string, string | undefined>; user?: unknown } = {
    headers: { authorization: `Bearer ${token}` },
  };

  assert.equal(await guard.canActivate(contextFor(request)), true);
  assert.equal((request.user as typeof activeUser).id, activeUser.id);
});

void test('accepts configured JWT cookie and rejects invalid or expired JWTs', async () => {
  const { jwt, guard } = createGuard();
  const valid = jwt.sign({ id: activeUser.id, email: activeUser.email });
  const cookieRequest: { headers: Record<string, string | undefined>; user?: unknown } = {
    headers: { cookie: `other=value; eazy_session=${valid}` },
  };
  assert.equal(await guard.canActivate(contextFor(cookieRequest)), true);

  await assert.rejects(
    guard.canActivate(contextFor({ headers: { authorization: 'Bearer invalid-token' } })),
    /Invalid or expired authentication/,
  );

  const expired = jwt.sign({ id: activeUser.id, email: activeUser.email }, Date.now() - 7_200_000);
  await assert.rejects(
    guard.canActivate(contextFor({ headers: { authorization: `Bearer ${expired}` } })),
    /Invalid or expired authentication/,
  );
});
