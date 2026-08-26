import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  normalizeCustomAlias,
  normalizeExpiration,
  RESERVED_ALIASES,
  validateTargetUrl,
} from './link-rules';

void describe('link input rules', () => {
  void it('accepts valid absolute HTTP and HTTPS target URLs', () => {
    assert.equal(validateTargetUrl('https://example.com/path?q=1'), 'https://example.com/path?q=1');
    assert.equal(validateTargetUrl('http://example.com'), 'http://example.com');
  });

  void it('rejects malformed, unsupported, credentialed, and overlong URLs', () => {
    assert.throws(() => validateTargetUrl('example.com'));
    assert.throws(() => validateTargetUrl('ftp://example.com/file'));
    assert.throws(() => validateTargetUrl('https://user:pass@example.com'));
    assert.throws(() => validateTargetUrl(`https://example.com/${'a'.repeat(2049)}`));
  });

  void it('normalizes valid custom aliases to lowercase', () => {
    assert.equal(normalizeCustomAlias('My_Link-1'), 'my_link-1');
  });

  void it('rejects invalid alias shape, length, and reserved aliases', () => {
    assert.throws(() => normalizeCustomAlias('ab'));
    assert.throws(() => normalizeCustomAlias('a'.repeat(33)));
    assert.throws(() => normalizeCustomAlias('_alias'));
    assert.throws(() => normalizeCustomAlias('bad.alias'));

    for (const alias of RESERVED_ALIASES) {
      assert.throws(() => normalizeCustomAlias(alias));
      assert.throws(() => normalizeCustomAlias(alias.toUpperCase()));
    }
  });

  void it('normalizes absent expiration to null and accepts future UTC dates', () => {
    const now = new Date('2026-08-26T00:00:00.000Z');
    assert.equal(normalizeExpiration(null, now), null);
    assert.equal(normalizeExpiration(undefined, now), null);
    assert.equal(
      normalizeExpiration('2026-08-27T03:04:05+07:00', now)?.toISOString(),
      '2026-08-26T20:04:05.000Z',
    );
  });

  void it('rejects invalid, current, and past expiration values', () => {
    const now = new Date('2026-08-26T00:00:00.000Z');
    assert.throws(() => normalizeExpiration('not-a-date', now));
    assert.throws(() => normalizeExpiration('2026-08-26T00:00:00.000Z', now));
    assert.throws(() => normalizeExpiration('2026-08-25T23:59:59.999Z', now));
  });
});
