import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { LinksModule } from '../links/links.module';
import { ClientLinksService } from './client-links.service';

@Module({
  imports: [DatabaseModule, LinksModule],
  providers: [ClientLinksService],
  exports: [ClientLinksService],
})
export class ClientApiModule {}
