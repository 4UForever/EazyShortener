import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  PasswordService,
} from './password.service';

const service = new PasswordService();

void test('hashes with Argon2id and verifies the matching password', async () => {
  const password = 'correct horse battery staple';
  const hash = await service.hash(password);

  assert.match(hash, /^\$argon2id\$/);
  assert.equal(await service.verify(hash, password), true);
  assert.equal(await service.verify(hash, 'this password is wrong'), false);
});

void test('accepts passwords at the minimum and maximum lengths', async () => {
  const minimum = 'a'.repeat(MIN_PASSWORD_LENGTH);
  const maximum = 'b'.repeat(MAX_PASSWORD_LENGTH);

  assert.equal(await service.verify(await service.hash(minimum), minimum), true);
  assert.equal(await service.verify(await service.hash(maximum), maximum), true);
});

void test('rejects passwords shorter than 12 characters', async () => {
  await assert.rejects(
    service.hash('a'.repeat(MIN_PASSWORD_LENGTH - 1)),
    /between 12 and 128 characters/,
  );
});

void test('rejects passwords longer than 128 characters', async () => {
  await assert.rejects(
    service.hash('a'.repeat(MAX_PASSWORD_LENGTH + 1)),
    /between 12 and 128 characters/,
  );
});
