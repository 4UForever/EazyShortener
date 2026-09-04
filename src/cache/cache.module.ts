import { Global, Module } from '@nestjs/common';
import { RedirectCacheService } from './redirect-cache.service';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedirectCacheService, RedisService],
  exports: [RedirectCacheService, RedisService],
})
export class CacheModule {}
