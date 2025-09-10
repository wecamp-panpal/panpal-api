import { Module } from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { RecipeController } from './recipe.controller';
import { PrismaService } from '../../common/prisma.service';
import { SupabaseService } from '../../common/supabase.service';

@Module({
  controllers: [RecipeController],
  providers: [RecipeService, PrismaService, SupabaseService],
  exports: [RecipeService],
})
export class RecipeModule {}
