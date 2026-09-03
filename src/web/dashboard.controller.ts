import { Body, Controller, Get, Header, Post, Req, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { JwtGuard } from '../auth/jwt.guard';
import { LinksService } from '../links/links.service';

interface DashboardRequest {
  user: User;
}

interface DashboardFormBody {
  originalUrl?: unknown;
  customAlias?: unknown;
  expiresAt?: unknown;
}

@Controller('dashboard')
@UseGuards(JwtGuard)
export class DashboardController {
  constructor(
    private readonly links: LinksService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  page(@Req() request: DashboardRequest): Promise<string> {
    return this.render(request.user.email, {});
  }

  @Post('links')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async createLink(@Req() request: DashboardRequest, @Body() body: DashboardFormBody): Promise<string> {
    const originalUrl = typeof body.originalUrl === 'string' ? body.originalUrl.trim() : '';
    const customAlias = typeof body.customAlias === 'string' && body.customAlias.trim() ? body.customAlias.trim() : null;
    const expiresAt = typeof body.expiresAt === 'string' && body.expiresAt.trim() ? body.expiresAt.trim() : null;

    try {
      const link = await this.links.createRegistered(request.user.id, { originalUrl, customAlias, expiresAt });
      const baseUrl = this.config.getOrThrow<string>('APP_BASE_URL').replace(/\/$/, '');
      return this.render(request.user.email, {
        message: `Created ${baseUrl}/${link.shortCode}`,
      });
    } catch (error) {
      return this.render(request.user.email, {
        error: error instanceof Error ? error.message : 'Unable to create link',
        originalUrl,
        customAlias: customAlias ?? '',
        expiresAt: expiresAt ?? '',
      });
    }
  }

  private async render(
    email: string,
    state: { message?: string; error?: string; originalUrl?: string; customAlias?: string; expiresAt?: string },
  ): Promise<string> {
    const template = await readFile(join(process.cwd(), 'views', 'dashboard.hbs'), 'utf8');
    const feedback = state.error
      ? `<p role="alert">${escapeHtml(state.error)}</p>`
      : state.message
        ? `<p role="status">${escapeHtml(state.message)}</p>`
        : '';

    return template
      .replace('{{dashboardEmail}}', escapeHtml(email))
      .replace('{{dashboardFeedback}}', feedback)
      .replace('{{dashboardOriginalUrl}}', escapeHtml(state.originalUrl ?? ''))
      .replace('{{dashboardCustomAlias}}', escapeHtml(state.customAlias ?? ''))
      .replace('{{dashboardExpiresAt}}', escapeHtml(state.expiresAt ?? ''));
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'\"]/g, (character) => {
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
