import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RedirectService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(shortCode: string): Promise<string> {
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

    return link.originalUrl;
  }
}
