import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ShortCodeService } from './short-code.service';

void describe('ShortCodeService', () => {
  void it('generates 7-character Base62 short codes', () => {
    const service = new ShortCodeService();

    for (let index = 0; index < 100; index += 1) {
      assert.match(service.generate(), /^[0-9A-Za-z]{7}$/);
    }
  });

  void it('retries when a generated code collides', async () => {
    class DeterministicShortCodeService extends ShortCodeService {
      private readonly values = ['AAAAAAA', 'BBBBBBB'];

      override generate(): string {
        return this.values.shift() ?? 'CCCCCCC';
      }
    }

    const service = new DeterministicShortCodeService();
    const seen: string[] = [];

    const result = await service.generateUnique((shortCode) => {
      seen.push(shortCode);
      return shortCode === 'AAAAAAA';
    });

    assert.equal(result, 'BBBBBBB');
    assert.deepEqual(seen, ['AAAAAAA', 'BBBBBBB']);
  });

  void it('fails after bounded collision retries', async () => {
    const service = new ShortCodeService();

    await assert.rejects(
      () => service.generateUnique(() => true),
      /Unable to generate a unique short code/,
    );
  });
});
