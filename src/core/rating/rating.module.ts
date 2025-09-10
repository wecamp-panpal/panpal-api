import { Module } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [RatingController],
  providers: [RatingService, PrismaService],
  exports: [RatingService],
})
export class RatingModule {}
