import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  async onModuleInit() {
    await this.$connect().then(() => {
      this.logger.log('PanPal Database is connected!');
    });
  }

  async onModuleDestroy() {
    await this.$disconnect().then(() => {
      this.logger.log('PanPal Database is disconnected!');
    });
  }
}
