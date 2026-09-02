import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '@prisma/client';
import { ApiTokenAuthService } from './api-token-auth.service';

interface ApiAuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: User;
}

@Injectable()
export class ApiTokenGuard implements CanActivate {
  constructor(private readonly auth: ApiTokenAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ApiAuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('API token required');
    }

    const rawToken = authorization.slice(7).trim();
    if (!rawToken) throw new UnauthorizedException('API token required');

    try {
      request.user = await this.auth.authenticate(rawToken);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired API token');
    }
  }
}
