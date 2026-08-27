import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { LinksController } from './links/links.controller';
import { LinksModule } from './links/links.module';
import { RedirectModule } from './redirect/redirect.module';

@Module({
  imports: [AppConfigModule, DatabaseModule, LinksModule, RedirectModule],
  controllers: [AppController, LinksController],
})
export class AppModule {}
