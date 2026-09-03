import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ClientApiModule } from './client-api/client-api.module';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { LinksController } from './links/links.controller';
import { LinksModule } from './links/links.module';
import { RedirectModule } from './redirect/redirect.module';
import { DashboardController } from './web/dashboard.controller';
import { GuestController } from './web/guest.controller';
import { TokenController } from './web/token.controller';

@Module({
  imports: [AppConfigModule, AuthModule, ClientApiModule, DatabaseModule, LinksModule, RedirectModule],
  controllers: [AppController, DashboardController, LinksController, GuestController, TokenController],
})
export class AppModule {}
