import { Injectable } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { ApiTokensService } from '../api-tokens/api-tokens.service';
import { IssuedApiToken } from '../api-tokens/api-token.service';
import { PrismaService } from '../database/prisma.service';

const TOKEN_BYTES = 32;

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly apiTokens: ApiTokensService,
  ) {}

  async issue(userId: string, now = new Date()): Promise<{ rawToken: string; expiresAt: Date }> {
    const rawToken = randomBytes(TOKEN_BYTES).toString('base64url');
    const tokenHash = this.hashToken(rawToken);
    const ttlSeconds = this.config.get<number>('EMAIL_VERIFICATION_TTL_SECONDS') ?? 86_400;
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return { rawToken, expiresAt };
  }

  async consume(rawToken: string, now = new Date()): Promise<string> {
    const tokenHash = this.hashToken(rawToken);
    const token = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true },
    });

    if (!token) throw new Error('Invalid or expired verification token');

    const result = await this.prisma.emailVerificationToken.updateMany({
      where: {
        id: token.id,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });

    if (result.count !== 1) throw new Error('Invalid or expired verification token');
    return token.userId;
  }

  async verify(
    rawToken: string,
    now = new Date(),
  ): Promise<{ userId: string; initialApiToken: IssuedApiToken | null }> {
    const tokenHash = this.hashToken(rawToken);

    const userId = await this.prisma.$transaction(async (tx) => {
      const token = await tx.emailVerificationToken.findUnique({
        where: { tokenHash },
        select: { id: true, userId: true },
      });

      if (!token) throw new Error('Invalid or expired verification token');

      const consumed = await tx.emailVerificationToken.updateMany({
        where: {
          id: token.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });

      if (consumed.count !== 1) throw new Error('Invalid or expired verification token');

      await tx.user.update({
        where: { id: token.userId },
        data: {
          status: UserStatus.ACTIVE,
          emailVerifiedAt: now,
        },
      });

      return token.userId;
    });

    const initialApiToken = await this.apiTokens.issueInitialIfAbsent(userId, now);
    return { userId, initialApiToken };
  }

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken, 'utf8').digest('hex');
  }
}
