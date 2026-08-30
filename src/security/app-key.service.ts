import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hkdfSync } from 'node:crypto';

const KEY_LENGTH = 32;
const JWT_INFO = 'eazyshortener:v1:jwt';
const IP_HASH_INFO = 'eazyshortener:v1:ip-hash';

@Injectable()
export class AppKeyService {
  private readonly rootSecret: Buffer;

  constructor(config: ConfigService) {
    this.rootSecret = Buffer.from(config.getOrThrow<string>('APP_SECRET'), 'utf8');
  }

  jwtKey(): Buffer {
    return this.derive(JWT_INFO);
  }

  ipHashKey(): Buffer {
    return this.derive(IP_HASH_INFO);
  }

  private derive(info: string): Buffer {
    return Buffer.from(hkdfSync('sha256', this.rootSecret, Buffer.alloc(0), info, KEY_LENGTH));
  }
}
