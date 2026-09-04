import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { RedirectCacheService } from '../cache/redirect-cache.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RedirectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedirectCacheService,
  ) {}

  async resolve(shortCode: string): Promise<string> {
    const cached = await this.cache.get(shortCode);
    if (cached) return cached;

    const link = await this.prisma.link.findUnique({
      where: { shortCode },
      select: {
        originalUrl: true,
        expiresAt: true,
        isActive: true,
      },
    });

    if (!link || !link.isActive) {
      throw new NotFoundException();
    }

    if (link.expiresAt && link.expiresAt.getTime() <= Date.now()) {
      throw new GoneException();
    }

    await this.cache.set(shortCode, link.originalUrl, link.expiresAt);
    return link.originalUrl;
  }
}
