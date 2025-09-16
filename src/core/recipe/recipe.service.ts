import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { SupabaseService } from '../../common/supabase.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import {
  RecipeListResponseDto,
  RecipeResponseDto,
} from './dto/recipe-response.dto';
import { RecipeCategory } from '@prisma/client';


@Injectable()
export class RecipeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async create(
    authorId: string,
    dto: CreateRecipeDto,
  ): Promise<RecipeResponseDto> {
    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
    });
    const recipe = await this.prisma.recipe.create({
      data: {
        title: dto.title,
        description: dto.description,
        cookingTime: dto.cookingTime,
        authorName: author?.name || author?.email || 'Anonymous',
        authorId,
        category: dto.category,
        imageUrl: dto.imageUrl,
        ingredients: {
          create: (dto.ingredients || []).map((it) => ({
            name: it.name,
            quantity: it.quantity,
          })),
        },
        steps: {
          create: (dto.steps || []).map((s, idx) => ({
            stepNumber: s.stepNumber ?? idx + 1,
            instruction: s.instruction,
          })),
        },
      },
      include: {
        ingredients: true,
        steps: true,
        comments: true,
        ratings: true,
        favorites: true,
      },
    });
    return new RecipeResponseDto(recipe, authorId);
  }

  async findAll(
    params: {
      page?: number;
      limit?: number;
      category?: RecipeCategory;
      search?: string;
    },
    currentUserId?: string,
  ): Promise<RecipeListResponseDto> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;
    const where: any = {};
    if (params.category) where.category = params.category;
    if (params.search)
      where.title = { contains: params.search, mode: 'insensitive' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.recipe.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          ingredients: true,
          steps: true,
          comments: true,
          ratings: true,
          favorites: true,
        },
      }),
      this.prisma.recipe.count({ where }),
    ]);

    return new RecipeListResponseDto(
      items.map((r) => new RecipeResponseDto(r, currentUserId)),
      {
        page,
        limit,
        total,
      },
    );
  }

  async findOne(
    id: string,
    currentUserId?: string,
  ): Promise<RecipeResponseDto> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: true,
        steps: true,
        comments: true,
        ratings: true,
        favorites: true,
      },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');
    return new RecipeResponseDto(recipe, currentUserId);
  }

  async update(
    id: string,
    dto: UpdateRecipeDto,
    requesterId?: string,
  ): Promise<RecipeResponseDto> {
    const existing = await this.prisma.recipe.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Recipe not found');
    if (requesterId && existing.authorId !== requesterId) {
      throw new NotFoundException('Recipe not found');
    }

    // Replace children if arrays provided
    const ingredientsOps = Array.isArray(dto.ingredients)
      ? {
          deleteMany: { recipeId: id },
          create: dto.ingredients.map((it) => ({
            name: it.name,
            quantity: it.quantity,
          })),
        }
      : undefined;
    const stepsOps = Array.isArray(dto.steps)
      ? {
          deleteMany: { recipeId: id },
          create: dto.steps.map((s, idx) => ({
            stepNumber: s.stepNumber ?? idx + 1,
            instruction: s.instruction,
          })),
        }
      : undefined;

    const recipe = await this.prisma.recipe.update({
      where: { id },
      data: {
        title: dto.title ?? undefined,
        description: dto.description ?? undefined,
        cookingTime: dto.cookingTime ?? undefined,
        category: dto.category ?? undefined,
        imageUrl: dto.imageUrl ?? undefined,
        ingredients: ingredientsOps as any,
        steps: stepsOps as any,
      },
      include: {
        ingredients: true,
        steps: true,
        comments: true,
        ratings: true,
        favorites: true,
      },
    });
    return new RecipeResponseDto(recipe, requesterId);
  }

  async remove(id: string, requesterId?: string): Promise<void> {
    const existing = await this.prisma.recipe.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Recipe not found');
    if (requesterId && existing.authorId !== requesterId) {
      throw new NotFoundException('Recipe not found');
    }
    await this.prisma.recipe.delete({ where: { id } });
  }

  async updateImage(
    id: string,
    file: Express.Multer.File,
    requesterId?: string,
  ): Promise<RecipeResponseDto> {
    const existing = await this.prisma.recipe.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Recipe not found');
    if (requesterId && existing.authorId !== requesterId) {
      throw new NotFoundException('Recipe not found');
    }

    const contentType = file.mimetype;
    const extension = contentType?.split('/')[1] || 'jpg';
    const filePath = `recipes/${id}.${extension}`;

    const publicUrl = await this.supabase.uploadPublic(
      filePath,
      file.buffer,
      contentType || 'image/jpeg',
    );

    const recipe = await this.prisma.recipe.update({
      where: { id },
      data: { imageUrl: publicUrl },
      include: {
        ingredients: true,
        steps: true,
        comments: true,
        ratings: true,
        favorites: true,
      },
    });
    return new RecipeResponseDto(recipe);
  }
}
