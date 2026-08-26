import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';

const BASE62_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const SHORT_CODE_LENGTH = 7;
const RANDOM_BYTE_ACCEPTANCE_LIMIT = 248;
const MAX_COLLISION_RETRIES = 5;

export type ShortCodeExists = (
  shortCode: string,
) => boolean | Promise<boolean>;

@Injectable()
export class ShortCodeService {
  generate(): string {
    let result = '';

    while (result.length < SHORT_CODE_LENGTH) {
      const bytes = randomBytes(SHORT_CODE_LENGTH - result.length);

      for (const byte of bytes) {
        if (byte >= RANDOM_BYTE_ACCEPTANCE_LIMIT) {
          continue;
        }

        result += BASE62_ALPHABET[byte % BASE62_ALPHABET.length];

        if (result.length === SHORT_CODE_LENGTH) {
          break;
        }
      }
    }

    return result;
  }

  async generateUnique(exists: ShortCodeExists): Promise<string> {
    for (let attempt = 0; attempt <= MAX_COLLISION_RETRIES; attempt += 1) {
      const shortCode = this.generate();

      if (!(await exists(shortCode))) {
        return shortCode;
      }
    }

    throw new Error('Unable to generate a unique short code');
  }
}
