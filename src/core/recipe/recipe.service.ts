import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ImageService } from '../../base/image';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import {
  RecipeListResponseDto,
  RecipeResponseDto,
} from './dto/recipe-response.dto';
import {
  EnhancedCacheService,
  CacheKeys,
  CacheTTL,
} from '../../common/cache/enhanced-cache.service';

@Injectable()
export class RecipeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageService: ImageService,
    private readonly cacheService: EnhancedCacheService,
  ) {}

  async create(
    authorId: string,
    dto: CreateRecipeDto,
    image?: Express.Multer.File,
  ): Promise<RecipeResponseDto> {
    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
    });

    let imageUrl = dto.imageUrl;

    // Handle image upload if provided (prioritize file upload over URL)
    if (image) {
      const uploadResult = await this.imageService.uploadImage(
        image,
        {
          folder: 'recipes',
          prefix: 'recipe-',
        },
        authorId,
      );
      imageUrl = uploadResult.url;
    }

    const recipe = await this.prisma.recipe.create({
      data: {
        title: dto.title,
        description: dto.description,
        cookingTime: dto.cookingTime,
        authorName: author?.name || author?.email || 'Anonymous',
        authorId,
        category: dto.category,
        imageUrl,
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
            imageUrl: s.imageUrl,
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

    // invalidate recipe caches sau khi tạo 1 recipe mới
    await this.invalidateRecipeCaches(recipe.id);

    return new RecipeResponseDto(recipe, authorId);
  }

  async findAll(
    params: {
      page?: number;
      limit?: number;
      category?: string;
      search?: string;
      authorId?: string;
    },
    currentUserId?: string,
  ): Promise<RecipeListResponseDto> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));

    // Generate cache key
    const cacheKey = CacheKeys.recipeList(
      params.category,
      params.search,
      page,
      limit,
      currentUserId,
      params.authorId,
    );

    // Try cache first, then fetch if needed
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const skip = (page - 1) * limit;
        const where: any = {};
        if (params.category) where.category = params.category;
        if (params.search) {
          where.OR = [
            { title: { contains: params.search, mode: 'insensitive' } },
            { description: { contains: params.search, mode: 'insensitive' } },
            { authorName: { contains: params.search, mode: 'insensitive' } },
          ];
        }
        if (params.authorId) where.authorId = params.authorId;

        const [items, total] = await this.prisma.$transaction([
          this.prisma.recipe.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            select: {
              id: true,
              title: true,
              description: true,
              cookingTime: true,
              authorName: true,
              authorId: true,
              category: true,
              imageUrl: true,
              ratingAvg: true,
              ratingCount: true,
              createdAt: true,
              updatedAt: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
              ingredients: true,
              steps: {
                orderBy: { stepNumber: 'asc' },
              },
              _count: {
                select: {
                  comments: true,
                  ratings: { where: { deletedAt: null } },
                  favorites: true,
                },
              },
              // Only load user's favorite if currentUserId is provided
              ...(currentUserId && {
                favorites: {
                  where: { userId: currentUserId },
                  select: { id: true, userId: true },
                },
              }),
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
      },
      {
        ttl: CacheTTL.RECIPE_LIST,
        bucket: 'recipes',
      },
    );
  }

  async findOne(
    id: string,
    currentUserId?: string,
  ): Promise<RecipeResponseDto> {
    const cacheKey = CacheKeys.recipeDetail(id, currentUserId);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const recipe = await this.prisma.recipe.findUnique({
          where: { id },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            ingredients: true,
            steps: {
              orderBy: { stepNumber: 'asc' },
            },
            comments: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'desc' },
              take: 10, // Only load latest 10 comments for performance
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            ratings: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'desc' },
              take: 10, // Only load latest 10 ratings for performance
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            ...(currentUserId && {
              favorites: {
                where: { userId: currentUserId },
                select: { id: true, userId: true },
              },
            }),
            _count: {
              select: {
                comments: { where: { deletedAt: null } },
                ratings: { where: { deletedAt: null } },
                favorites: true,
              },
            },
          },
        });
        if (!recipe) throw new NotFoundException('Recipe not found');
        return new RecipeResponseDto(recipe, currentUserId);
      },
      {
        ttl: CacheTTL.RECIPE_DETAIL,
        bucket: 'recipes',
      },
    );
  }

  async update(
    id: string,
    dto: UpdateRecipeDto,
    requesterId?: string,
  ): Promise<RecipeResponseDto> {
    const existing = await this.prisma.recipe.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Recipe not found');
    if (requesterId && existing.authorId !== requesterId) {
      throw new ForbiddenException('Access denied');
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
            imageUrl: s.imageUrl,
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

    // Invalidate recipe caches
    await this.invalidateRecipeCaches(id);

    return new RecipeResponseDto(recipe, requesterId);
  }

  async remove(id: string, requesterId?: string): Promise<void> {
    const existing = await this.prisma.recipe.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Recipe not found');
    if (requesterId && existing.authorId !== requesterId) {
      throw new ForbiddenException('Access denied');
    }
    await this.prisma.recipe.delete({ where: { id } });

    // Invalidate recipe caches
    await this.invalidateRecipeCaches(id);
  }

  async updateImage(
    id: string,
    file: Express.Multer.File,
    requesterId?: string,
  ): Promise<RecipeResponseDto> {
    const existing = await this.prisma.recipe.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Recipe not found');
    if (requesterId && existing.authorId !== requesterId) {
      throw new ForbiddenException('Access denied');
    }

    const uploadResult = await this.imageService.uploadImage(
      file,
      {
        folder: 'recipes',
        prefix: 'recipe-update-',
      },
      requesterId,
    );

    const recipe = await this.prisma.recipe.update({
      where: { id },
      data: { imageUrl: uploadResult.url },
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

  async updateStepImage(
    recipeId: string,
    stepId: string,
    file: Express.Multer.File,
    requesterId?: string,
  ): Promise<{ success: boolean; imageUrl: string }> {
    // Check if recipe exists and user has permission
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { steps: true },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');
    if (requesterId && recipe.authorId !== requesterId) {
      throw new ForbiddenException('Access denied');
    }

    // Check if step exists
    const step = recipe.steps.find((s) => s.id === stepId);
    if (!step) throw new NotFoundException('Step not found');

    // Upload image
    const uploadResult = await this.imageService.uploadImage(
      file,
      {
        folder: 'steps',
        prefix: 'step-',
      },
      requesterId,
    );

    // Update step with image URL
    await this.prisma.step.update({
      where: { id: stepId },
      data: { imageUrl: uploadResult.url },
    });

    return {
      success: true,
      imageUrl: uploadResult.url,
    };
  }

  /**
   * Invalidate recipe-related caches
   */
  private async invalidateRecipeCaches(recipeId: string): Promise<void> {
    try {
      // Invalidate specific recipe detail caches
      await this.cacheService.invalidatePattern(
        CacheKeys.recipePattern(recipeId),
        'recipes',
      );

      // Invalidate recipe lists (all categories, searches, etc.)
      await this.cacheService.invalidatePattern('recipes:list:*', 'recipes');

      // Invalidate trending recipes
      await this.cacheService.invalidatePattern(
        'recipes:trending:*',
        'recipes',
      );

      // Note: User-specific caches (favorites) will be invalidated by their respective services
    } catch (error) {
      // Log but don't throw - cache invalidation shouldn't break the main operation
      console.error('Cache invalidation failed:', error);
    }
  }
}
