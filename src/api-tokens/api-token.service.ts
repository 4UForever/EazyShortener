import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';

export interface IssueApiTokenInput {
  userId: string;
  name: string;
  expiresAt?: Date | null;
}

export interface IssuedApiToken {
  id: string;
  rawToken: string;
  tokenPrefix: string;
  expiresAt: Date | null;
}

@Injectable()
export class ApiTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async issue(input: IssueApiTokenInput): Promise<IssuedApiToken> {
    const configuredPrefix = this.config.getOrThrow<string>('API_TOKEN_PREFIX');
    if (configuredPrefix !== 'ez_live_') {
      throw new Error('API_TOKEN_PREFIX must be ez_live_');
    }

    const tokenBytes = this.config.get<number>('API_TOKEN_BYTES') ?? 32;
    if (!Number.isInteger(tokenBytes) || tokenBytes <= 0) {
      throw new Error('API_TOKEN_BYTES must be a positive integer');
    }

    const rawToken = `${configuredPrefix}${randomBytes(tokenBytes).toString('base64url')}`;
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const tokenPrefix = rawToken.slice(0, configuredPrefix.length + 8);
    const expiresAt = input.expiresAt ?? null;

    const token = await this.prisma.apiToken.create({
      data: {
        userId: input.userId,
        name: input.name,
        tokenPrefix,
        tokenHash,
        expiresAt,
      },
    });

    return {
      id: token.id,
      rawToken,
      tokenPrefix,
      expiresAt: token.expiresAt,
    };
  }
}
