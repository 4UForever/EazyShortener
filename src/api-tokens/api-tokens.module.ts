import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ApiTokenAuthService } from './api-token-auth.service';
import { ApiTokenGuard } from './api-token.guard';
import { ApiTokenService } from './api-token.service';
import { ApiTokensService } from './api-tokens.service';

@Module({
  imports: [DatabaseModule],
  providers: [ApiTokenAuthService, ApiTokenGuard, ApiTokenService, ApiTokensService],
  exports: [ApiTokenAuthService, ApiTokenGuard, ApiTokenService, ApiTokensService],
})
export class ApiTokensModule {}
