import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';

const TOKEN_BYTES = 32;

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
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

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken, 'utf8').digest('hex');
  }
}
