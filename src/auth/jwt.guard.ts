import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';

interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: User;
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly strategy: JwtStrategy,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) throw new UnauthorizedException('Authentication required');

    try {
      request.user = await this.strategy.authenticate(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication');
    }
  }

  private extractToken(request: AuthenticatedRequest): string | null {
    const authorization = request.headers.authorization;
    if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
      const token = authorization.slice(7).trim();
      if (token) return token;
    }

    const cookieHeader = request.headers.cookie;
    if (typeof cookieHeader !== 'string') return null;

    const cookieName = this.config.getOrThrow<string>('JWT_COOKIE_NAME');
    for (const part of cookieHeader.split(';')) {
      const [name, ...valueParts] = part.trim().split('=');
      if (name === cookieName) {
        const value = valueParts.join('=').trim();
        return value || null;
      }
    }

    return null;
  }
}
