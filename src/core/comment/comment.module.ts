import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { PrismaService } from '../../common/prisma.service';
import { ImageService } from '../../base/image/image.service';
import { SupabaseService } from '../../common/supabase.service';

@Module({
  controllers: [CommentController],
  providers: [CommentService, PrismaService, ImageService, SupabaseService],
  exports: [CommentService],
})
export class CommentModule {}
