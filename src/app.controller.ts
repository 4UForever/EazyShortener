import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class AppController {
  @Get()
  getServiceInfo(): { name: string; status: string } {
    return {
      name: 'EazyShortener',
      status: 'ok',
    };
  }
}
