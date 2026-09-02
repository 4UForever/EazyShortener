import assert from 'node:assert/strict';
import test from 'node:test';
import { validateBatchShortenDto } from './dto/batch-shorten.dto';

const now = new Date('2026-09-02T00:00:00.000Z');

void test('accepts batches from 1 through 10 items and preserves input order', () => {
  const links = Array.from({ length: 10 }, (_, index) => ({ url: `https://example.com/${index}` }));
  const result = validateBatchShortenDto({ links }, now);

  assert.equal(result.length, 10);
  assert.equal(result[0]?.url, 'https://example.com/0');
  assert.equal(result[9]?.url, 'https://example.com/9');
});

void test('rejects empty and oversized batches', () => {
  assert.throws(() => validateBatchShortenDto({ links: [] }, now), /between 1 and 10/);
  assert.throws(
    () => validateBatchShortenDto({ links: Array.from({ length: 11 }, () => ({ url: 'https://example.com' })) }, now),
    /between 1 and 10/,
  );
});

void test('validates URL, alias and expiration using canonical link rules', () => {
  assert.throws(() => validateBatchShortenDto({ links: [{ url: 'ftp://example.com' }] }, now), /HTTP or HTTPS/);
  assert.throws(
    () => validateBatchShortenDto({ links: [{ url: 'https://example.com', customAlias: 'API' }] }, now),
    /reserved/,
  );
  assert.throws(
    () => validateBatchShortenDto({ links: [{ url: 'https://example.com', expiresAt: '2026-09-01T23:59:59Z' }] }, now),
    /future/,
  );

  const [valid] = validateBatchShortenDto(
    {
      links: [
        {
          url: 'https://example.com/docs',
          customAlias: 'My-Docs',
          expiresAt: '2026-09-03T00:00:00Z',
        },
      ],
    },
    now,
  );
  assert.equal(valid?.customAlias, 'my-docs');
  assert.equal(valid?.expiresAt?.toISOString(), '2026-09-03T00:00:00.000Z');
});
