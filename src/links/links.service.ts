import { Injectable } from '@nestjs/common';
import { Link, LinkCreatedVia } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateLinkDto } from './dto/create-link.dto';
import {
  normalizeExpiration,
  RESERVED_ALIASES,
  validateTargetUrl,
} from './link-rules';
import { ShortCodeService } from './short-code.service';

export interface LinkCreationContext {
  userId: string | null;
  createdVia: LinkCreatedVia;
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

  async create(
    input: CreateLinkDto,
    context: LinkCreationContext,
  ): Promise<Link> {
    const originalUrl = validateTargetUrl(input.originalUrl);
    const expiresAt = normalizeExpiration(input.expiresAt);
    const shortCode = await this.shortCodes.generateUnique(async (candidate) => {
      if (RESERVED_ALIASES.has(candidate.toLowerCase())) {
        return true;
      }

      const existing = await this.prisma.link.findUnique({
        where: { shortCode: candidate },
        select: { id: true },
      });

      return existing !== null;
    });

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
}
