import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly client;

  constructor(config: ConfigService) {
    this.client = createClient({ url: config.getOrThrow<string>('REDIS_URL') });
  }

  async onModuleInit(): Promise<void> {
    if (!this.client.isOpen) await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) await this.client.quit();
  }

  get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async setEx(key: string, ttlSeconds: number, value: string): Promise<void> {
    await this.client.setEx(key, ttlSeconds, value);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  ping(): Promise<string> {
    return this.client.ping();
  }
}
