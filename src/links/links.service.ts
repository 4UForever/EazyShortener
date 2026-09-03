import { Injectable } from '@nestjs/common';
import { Link, LinkCreatedVia, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { LinkPagination } from './dto/list-links.dto';
import {
  normalizeCustomAlias,
  normalizeExpiration,
  RESERVED_ALIASES,
  validateTargetUrl,
} from './link-rules';
import { ShortCodeService } from './short-code.service';

export interface LinkCreationContext {
  userId: string | null;
  createdVia: LinkCreatedVia;
}

export interface ApiBatchLinkInput {
  originalUrl: string;
  customAlias: string | null;
  expiresAt: Date | null;
}

@Injectable()
export class LinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shortCodes: ShortCodeService,
  ) {}

  async createGuest(input: CreateLinkDto): Promise<Link> {
    return this.create(input, {
      userId: null,
      createdVia: LinkCreatedVia.GUEST_WEB,
    });
  }

  async listOwned(userId: string, pagination: LinkPagination): Promise<{ links: Link[]; total: number }> {
    const where = { userId };
    const [links, total] = await this.prisma.$transaction([
      this.prisma.link.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.prisma.link.count({ where }),
    ]);

    return { links, total };
  }

  async createRegistered(
    userId: string,
    input: CreateLinkDto & { customAlias?: string | null },
  ): Promise<Link> {
    const originalUrl = validateTargetUrl(input.originalUrl);
    const expiresAt = normalizeExpiration(input.expiresAt);
    const shortCode = input.customAlias
      ? await this.resolveCustomAlias(this.prisma, input.customAlias)
      : await this.generateShortCode(this.prisma);

    return this.prisma.link.create({
      data: {
        userId,
        shortCode,
        originalUrl,
        expiresAt,
        isActive: true,
        createdVia: LinkCreatedVia.USER_WEB,
      },
    });
  }

  async createApiInTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    input: ApiBatchLinkInput,
  ): Promise<Link> {
    const originalUrl = validateTargetUrl(input.originalUrl);
    const shortCode = input.customAlias
      ? await this.resolveCustomAlias(tx, input.customAlias)
      : await this.generateShortCode(tx);

    return tx.link.create({
      data: {
        userId,
        shortCode,
        originalUrl,
        expiresAt: input.expiresAt,
        isActive: true,
        createdVia: LinkCreatedVia.API,
      },
    });
  }

  async create(
    input: CreateLinkDto,
    context: LinkCreationContext,
  ): Promise<Link> {
    const originalUrl = validateTargetUrl(input.originalUrl);
    const expiresAt = normalizeExpiration(input.expiresAt);
    const shortCode = await this.generateShortCode(this.prisma);

    return this.prisma.link.create({
      data: {
        userId: context.userId,
        shortCode,
        originalUrl,
        expiresAt,
        isActive: true,
        createdVia: context.createdVia,
      },
    });
  }

  private generateShortCode(client: Pick<Prisma.TransactionClient, 'link'>): Promise<string> {
    return this.shortCodes.generateUnique(async (candidate) => {
      if (RESERVED_ALIASES.has(candidate.toLowerCase())) return true;

      const existing = await client.link.findUnique({
        where: { shortCode: candidate },
        select: { id: true },
      });
      return existing !== null;
    });
  }

  private async resolveCustomAlias(
    client: Pick<Prisma.TransactionClient, 'link'>,
    value: string,
  ): Promise<string> {
    const alias = normalizeCustomAlias(value);
    const existing = await client.link.findUnique({
      where: { shortCode: alias },
      select: { id: true },
    });
    if (existing) throw new Error('Custom alias is already in use');
    return alias;
  }
}
