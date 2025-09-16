import { Module } from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { RecipeController } from './recipe.controller';
import { PrismaService } from '../../common/prisma.service';
import { ImageModule } from '../../base/image';

@Module({
  imports: [ImageModule],
  controllers: [RecipeController],
  providers: [RecipeService, PrismaService],
  exports: [RecipeService],
})
export class RecipeModule {}
