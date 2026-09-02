import { Injectable } from '@nestjs/common';
import { Link } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { LinksService } from '../links/links.service';
import { BatchShortenDto, validateBatchShortenDto } from './dto/batch-shorten.dto';

@Injectable()
export class ClientLinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly links: LinksService,
  ) {}

  async createBatch(userId: string, input: BatchShortenDto, now = new Date()): Promise<Link[]> {
    const items = validateBatchShortenDto(input, now);

    return this.prisma.$transaction(async (tx) => {
      const created: Link[] = [];

      for (const item of items) {
        created.push(
          await this.links.createApiInTransaction(tx, userId, {
            originalUrl: item.url,
            customAlias: item.customAlias,
            expiresAt: item.expiresAt,
          }),
        );
      }

      return created;
    });
  }
}
