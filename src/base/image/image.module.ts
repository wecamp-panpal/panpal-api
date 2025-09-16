import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { SupabaseService } from '../../common/supabase.service';

@Module({
  providers: [ImageService, SupabaseService],
  exports: [ImageService],
})
export class ImageModule {}
