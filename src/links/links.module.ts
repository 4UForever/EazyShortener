import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { LinksService } from './links.service';
import { ShortCodeService } from './short-code.service';

@Module({
  imports: [DatabaseModule],
  providers: [LinksService, ShortCodeService],
  exports: [LinksService],
})
export class LinksModule {}
