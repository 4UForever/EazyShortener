import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ApiTokenService } from './api-token.service';
import { ApiTokensService } from './api-tokens.service';

@Module({
  imports: [DatabaseModule],
  providers: [ApiTokenService, ApiTokensService],
  exports: [ApiTokenService, ApiTokensService],
})
export class ApiTokensModule {}
