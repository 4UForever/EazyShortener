import { Injectable } from '@nestjs/common';
import { ApiToken } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ApiTokenService, IssuedApiToken } from './api-token.service';
import { CreateApiTokenDto } from './dto/create-api-token.dto';

@Injectable()
export class ApiTokensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generator: ApiTokenService,
  ) {}

  list(userId: string): Promise<ApiToken[]> {
    return this.prisma.apiToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, input: CreateApiTokenDto): Promise<IssuedApiToken> {
    const name = input.name.trim();
    if (!name) throw new Error('Token name is required');

    let expiresAt: Date | null = null;
    if (input.expiresAt) {
      expiresAt = new Date(input.expiresAt);
      if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
        throw new Error('Token expiration must be in the future');
      }
    }

    return this.generator.issue({ userId, name, expiresAt });
  }

  async revoke(userId: string, tokenId: string): Promise<ApiToken> {
    const existing = await this.prisma.apiToken.findFirst({ where: { id: tokenId, userId } });
    if (!existing) throw new Error('API token not found');
    if (existing.revokedAt) return existing;

    return this.prisma.apiToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  }
}
