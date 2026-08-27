import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;

const ARGON2_OPTIONS: argon2.Options & { type: number } = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    this.validate(password);
    return argon2.hash(password, ARGON2_OPTIONS);
  }

  async verify(hash: string, password: string): Promise<boolean> {
    this.validate(password);
    return argon2.verify(hash, password);
  }

  private validate(password: string): void {
    const length = Array.from(password).length;

    if (length < MIN_PASSWORD_LENGTH || length > MAX_PASSWORD_LENGTH) {
      throw new Error('Password must be between 12 and 128 characters');
    }
  }
}
