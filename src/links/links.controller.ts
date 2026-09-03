import { BadRequestException, Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { JwtGuard } from '../auth/jwt.guard';
import { CreateLinkDto } from './dto/create-link.dto';
import { ListLinksDto, normalizeLinkPagination } from './dto/list-links.dto';
import { LinksService } from './links.service';

interface AuthenticatedLinksRequest {
  user: User;
}

interface GuestCreateLinkBody {
  originalUrl?: unknown;
  expiresAt?: unknown;
  customAlias?: unknown;
  urls?: unknown;
}

@Controller('api/links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Get()
  @UseGuards(JwtGuard)
  async listOwned(@Req() request: AuthenticatedLinksRequest, @Query() query: ListLinksDto) {
    const pagination = normalizeLinkPagination(query);
    const result = await this.linksService.listOwned(request.user.id, pagination);

    return {
      links: result.links,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
      },
    };
  }

  @Post('guest')
  async createGuest(@Body() body: GuestCreateLinkBody) {
    if (body.customAlias !== undefined) {
      throw new BadRequestException('Guest links cannot use custom aliases');
    }

    if (body.urls !== undefined || typeof body.originalUrl !== 'string') {
      throw new BadRequestException('Guest creation accepts exactly one URL');
    }

    if (
      body.expiresAt !== undefined &&
      body.expiresAt !== null &&
      typeof body.expiresAt !== 'string'
    ) {
      throw new BadRequestException('Expiration must be a date/time string or null');
    }

    const input: CreateLinkDto = {
      originalUrl: body.originalUrl,
      expiresAt: body.expiresAt,
    };

    return this.linksService.createGuest(input);
  }
}
