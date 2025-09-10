import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import {
  RecipeListResponseDto,
  RecipeResponseDto,
} from '../recipe/dto/recipe-response.dto';

@Injectable()
export class FavoriteService {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: string, recipeId: string): Promise<void> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');
    await this.prisma.favorite.upsert({
      where: { userId_recipeId: { userId, recipeId } },
      create: { userId, recipeId },
      update: {},
    });
  }

  async remove(userId: string, recipeId: string): Promise<void> {
    await this.prisma.favorite.delete({
      where: { userId_recipeId: { userId, recipeId } },
    });
  }

  async list(userId: string, params: { page?: number; limit?: number }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.favorite.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          recipe: {
            include: {
              ingredients: true,
              steps: true,
              comments: true,
              ratings: true,
              favorites: true,
            },
          },
        },
      }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);
    return {
      items: items.map((f) => ({
        recipe: new RecipeResponseDto(f.recipe),
        createdAt: f.createdAt,
      })),
      page,
      limit,
      total,
    };
  }

  async listRecipes(
    userId: string,
    params: { page?: number; limit?: number },
  ): Promise<RecipeListResponseDto> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          recipe: {
            include: {
              ingredients: true,
              steps: true,
              comments: true,
              ratings: true,
              favorites: true,
            },
          },
        },
      }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);
    return new RecipeListResponseDto(
      items.map((f) => new RecipeResponseDto(f.recipe)),
      { page, limit, total },
    );
  }
}
