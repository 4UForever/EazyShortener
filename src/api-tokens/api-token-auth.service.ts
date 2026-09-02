import { Injectable } from '@nestjs/common';
import { User, UserStatus } from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ApiTokenAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async authenticate(rawToken: string, now = new Date()): Promise<User> {
    const tokenHash = createHash('sha256').update(rawToken, 'utf8').digest('hex');
    const token = await this.prisma.apiToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !token ||
      token.revokedAt !== null ||
      (token.expiresAt !== null && token.expiresAt.getTime() <= now.getTime()) ||
      token.user.status !== UserStatus.ACTIVE ||
      token.user.emailVerifiedAt === null
    ) {
      throw new Error('Invalid API token');
    }

    const updated = await this.prisma.apiToken.updateMany({
      where: {
        id: token.id,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      data: { lastUsedAt: now },
    });

    if (updated.count !== 1) throw new Error('Invalid API token');
    return token.user;
  }
}
