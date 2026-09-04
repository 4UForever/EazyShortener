import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

const KEY_PREFIX = 'redirect:';

@Injectable()
export class RedirectCacheService {
  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  get(shortCode: string): Promise<string | null> {
    return this.redis.get(this.key(shortCode));
  }

  async set(shortCode: string, originalUrl: string, expiresAt: Date | null, now = new Date()): Promise<void> {
    const maxTtl = this.config.get<number>('REDIRECT_CACHE_MAX_TTL_SECONDS') ?? 3_600;
    let ttlSeconds = maxTtl;

    if (expiresAt) {
      const remainingSeconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
      if (remainingSeconds < 1) return;
      ttlSeconds = Math.min(maxTtl, remainingSeconds);
    }

    if (ttlSeconds < 1) return;
    await this.redis.setEx(this.key(shortCode), ttlSeconds, originalUrl);
  }

  invalidate(shortCode: string): Promise<void> {
    return this.redis.del(this.key(shortCode));
  }

  private key(shortCode: string): string {
    return `${KEY_PREFIX}${shortCode}`;
  }
}
