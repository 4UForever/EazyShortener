import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { LinksController } from './links/links.controller';
import { LinksModule } from './links/links.module';

@Module({
  imports: [AppConfigModule, DatabaseModule, LinksModule],
  controllers: [AppController, LinksController],
})
export class AppModule {}
