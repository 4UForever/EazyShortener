import { Body, Controller, Get, Header, Post } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { LinksService } from '../links/links.service';

interface GuestFormBody {
  originalUrl?: unknown;
  expiration?: unknown;
  customExpiration?: unknown;
}

interface GuestViewState {
  originalUrl?: string;
  error?: string;
  shortCode?: string;
}

const EXPIRATION_MS: Record<string, number> = {
  '1h': 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

@Controller()
export class GuestController {
  constructor(private readonly links: LinksService) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  async index(): Promise<string> {
    return this.render({});
  }

  @Post('shorten')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async shorten(@Body() body: GuestFormBody): Promise<string> {
    const originalUrl = typeof body.originalUrl === 'string' ? body.originalUrl.trim() : '';

    try {
      const expiresAt = this.resolveExpiration(body.expiration, body.customExpiration);
      const link = await this.links.createGuest({ originalUrl, expiresAt });
      return this.render({ originalUrl, shortCode: link.shortCode });
    } catch (error) {
      return this.render({
        originalUrl,
        error: error instanceof Error ? error.message : 'Unable to shorten this URL',
      });
    }
  }

  private resolveExpiration(expiration: unknown, customExpiration: unknown): string | null {
    if (expiration == null || expiration === '' || expiration === 'never') {
      return null;
    }

    if (typeof expiration !== 'string') {
      throw new Error('Choose a valid expiration option');
    }

    if (expiration === 'custom') {
      if (typeof customExpiration !== 'string' || customExpiration.length === 0) {
        throw new Error('Choose a custom expiration date and time');
      }
      return new Date(customExpiration).toISOString();
    }

    const duration = EXPIRATION_MS[expiration];
    if (!duration) {
      throw new Error('Choose a valid expiration option');
    }

    return new Date(Date.now() + duration).toISOString();
  }

  private async render(state: GuestViewState): Promise<string> {
    const template = await readFile(join(process.cwd(), 'views', 'index.hbs'), 'utf8');
    const originalUrl = escapeHtml(state.originalUrl ?? '');
    const result = state.shortCode
      ? `<div class="shortener-result" role="status"><span>Your short link</span><a href="/${escapeHtml(state.shortCode)}">/${escapeHtml(state.shortCode)}</a></div>`
      : '';
    const error = state.error
      ? `<p class="shortener-error" role="alert">${escapeHtml(state.error)}</p>`
      : '';

    return template
      .replaceAll('{{guestOriginalUrl}}', originalUrl)
      .replace('{{guestResult}}', result)
      .replace('{{guestError}}', error);
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[character];
  });
}
