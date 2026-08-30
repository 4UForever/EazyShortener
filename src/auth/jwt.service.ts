import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { AppKeyService } from '../security/app-key.service';

export interface JwtClaims {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtService {
  constructor(
    private readonly config: ConfigService,
    private readonly appKeys: AppKeyService,
  ) {}

  sign(user: { id: string; email: string }, now = Date.now()): string {
    const issuedAt = Math.floor(now / 1000);
    const ttlSeconds = this.config.get<number>('JWT_ACCESS_TTL_SECONDS') ?? 3600;
    const header = encodeJson({ alg: 'HS256', typ: 'JWT' });
    const payload = encodeJson({ sub: user.id, email: user.email, iat: issuedAt, exp: issuedAt + ttlSeconds });
    const signingInput = `${header}.${payload}`;
    return `${signingInput}.${this.signature(signingInput)}`;
  }

  verify(token: string, now = Date.now()): JwtClaims {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT');

    const [headerPart, payloadPart, signaturePart] = parts;
    const signingInput = `${headerPart}.${payloadPart}`;
    const expected = Buffer.from(this.signature(signingInput), 'base64url');
    const actual = Buffer.from(signaturePart, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('Invalid JWT');

    const header = JSON.parse(Buffer.from(headerPart, 'base64url').toString('utf8')) as { alg?: string; typ?: string };
    if (header.alg !== 'HS256' || header.typ !== 'JWT') throw new Error('Invalid JWT');

    const claims = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8')) as Partial<JwtClaims>;
    if (
      typeof claims.sub !== 'string' ||
      typeof claims.email !== 'string' ||
      typeof claims.iat !== 'number' ||
      typeof claims.exp !== 'number' ||
      claims.exp <= Math.floor(now / 1000)
    ) {
      throw new Error('Invalid or expired JWT');
    }

    return claims as JwtClaims;
  }

  private signature(signingInput: string): string {
    return createHmac('sha256', this.appKeys.jwtKey()).update(signingInput).digest('base64url');
  }
}

function encodeJson(value: object): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}
