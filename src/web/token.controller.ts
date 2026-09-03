import { Body, Controller, Get, Header, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiToken, User } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ApiTokensService } from '../api-tokens/api-tokens.service';
import { JwtGuard } from '../auth/jwt.guard';

interface TokenPageRequest {
  user: User;
}

interface TokenFormBody {
  name?: unknown;
  expiresAt?: unknown;
}

@Controller('api-tokens')
@UseGuards(JwtGuard)
export class TokenController {
  constructor(private readonly tokens: ApiTokensService) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  async page(@Req() request: TokenPageRequest): Promise<string> {
    return this.render(await this.tokens.list(request.user.id));
  }

  @Post()
  @Header('Content-Type', 'text/html; charset=utf-8')
  async create(@Req() request: TokenPageRequest, @Body() body: TokenFormBody): Promise<string> {
    try {
      const issued = await this.tokens.create(request.user.id, {
        name: typeof body.name === 'string' ? body.name : '',
        expiresAt: typeof body.expiresAt === 'string' && body.expiresAt.trim() ? body.expiresAt.trim() : null,
      });
      return this.render(await this.tokens.list(request.user.id), issued.rawToken);
    } catch (error) {
      return this.render(
        await this.tokens.list(request.user.id),
        undefined,
        error instanceof Error ? error.message : 'Unable to create API token',
      );
    }
  }

  @Post(':id/revoke')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async revoke(@Req() request: TokenPageRequest, @Param('id') id: string): Promise<string> {
    await this.tokens.revoke(request.user.id, id);
    return this.render(await this.tokens.list(request.user.id));
  }

  private async render(tokens: ApiToken[], rawToken?: string, error?: string): Promise<string> {
    const template = await readFile(join(process.cwd(), 'views', 'api-tokens.hbs'), 'utf8');
    const rows = tokens
      .map(
        (token) => `<tr><td>${escapeHtml(token.name)}</td><td>${escapeHtml(token.tokenPrefix)}</td><td>${token.expiresAt ? escapeHtml(token.expiresAt.toISOString()) : 'Never'}</td><td>${token.revokedAt ? 'Revoked' : `<form method="post" action="/api-tokens/${encodeURIComponent(token.id)}/revoke"><button type="submit">Revoke</button></form>`}</td></tr>`,
      )
      .join('');
    const feedback = error
      ? `<p role="alert">${escapeHtml(error)}</p>`
      : rawToken
        ? `<section role="status"><strong>Copy this token now. It will not be shown again.</strong><code>${escapeHtml(rawToken)}</code></section>`
        : '';

    return template.replace('{{apiTokenFeedback}}', feedback).replace('{{apiTokenRows}}', rows);
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'\"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character);
}
