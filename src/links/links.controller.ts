import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { CreateLinkDto } from './dto/create-link.dto';
import { LinksService } from './links.service';

interface GuestCreateLinkBody {
  originalUrl?: unknown;
  expiresAt?: unknown;
  customAlias?: unknown;
  urls?: unknown;
}

@Controller('api/links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

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
