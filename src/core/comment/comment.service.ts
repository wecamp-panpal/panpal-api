import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import {
  CommentListResponseDto,
  CommentResponseDto,
  RatingSummaryDto,
} from './dto/comment-response.dto';
import { ImageService } from '../../base/image/image.service';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly imageService: ImageService,
  ) {}

  async create(
    userId: string,
    dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    this.logger.log(
      `Creating comment for recipe ${dto.recipeId} by user ${userId}${dto.rating ? ` with rating ${dto.rating}` : ''}`,
    );

    // Validate recipe exists
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: dto.recipeId },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    // If this is a rating comment, validate rating and check constraints
    if (dto.rating) {
      if (dto.rating < 1 || dto.rating > 5) {
        throw new BadRequestException('Rating must be between 1 and 5');
      }

      // Can't rate own recipe
      if (recipe.authorId === userId) {
        throw new BadRequestException('You cannot rate your own recipe');
      }

      // Check if user already rated this recipe
      const existingRating = await this.prisma.comment.findFirst({
        where: {
          recipeId: dto.recipeId,
          userId,
          rating: { not: null },
          deletedAt: null,
        },
      });

      if (existingRating) {
        throw new BadRequestException('You have already rated this recipe');
      }
    }

    // Validate images if provided
    if (dto.imageUrls && dto.imageUrls.length > 10) {
      throw new BadRequestException('Maximum 10 images allowed');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Create comment
      const comment = await tx.comment.create({
        data: {
          recipeId: dto.recipeId,
          userId,
          content: dto.content,
          rating: dto.rating || null,
          imageUrls: dto.imageUrls || [],
        },
        include: this.getCommentIncludes(),
      });

      // If this was a rating, update recipe stats
    if (dto.rating) {
        await this.updateRecipeRatingStats(tx, dto.recipeId);
      }

      this.logger.log(`Comment ${comment.id} created successfully`);
      return new CommentResponseDto(comment);
    });
  }

  async findAll(
    recipeId: string,
    params: {
      page?: number;
      limit?: number;
      type?: 'all' | 'ratings' | 'comments';
      sortBy?: 'newest' | 'oldest' | 'most_helpful' | 'highest_rated';
      currentUserId?: string;
    },
  ): Promise<CommentListResponseDto> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      recipeId,
      deletedAt: null,
    };

    // Filter by type
    switch (params.type) {
      case 'ratings':
        where.rating = { not: null };
        break;
      case 'comments':
        where.rating = null;
        break;
      default:
        // 'all' - no additional filter
        break;
    }

    // Build orderBy
    let orderBy: any = { createdAt: 'desc' };
    switch (params.sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'most_helpful':
        orderBy = { helpfulCount: 'desc' };
        break;
      case 'highest_rated':
        orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }];
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [items, total, stats] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          ...this.getCommentIncludes(),
          helpfulVotes: params.currentUserId
            ? {
                where: { userId: params.currentUserId },
                select: { userId: true },
              }
            : false,
        },
      }),

      this.prisma.comment.count({ where }),

      // Get type breakdown stats
      this.prisma.comment.groupBy({
        by: ['rating'],
        where: { recipeId, deletedAt: null },
        _count: {
          rating: true,
        },
        orderBy: { rating: 'desc' },
      }),
    ]);

    // Calculate stats
    const ratingsCount = stats
      .filter((s) => s.rating !== null)
      .reduce((sum, s) => {
        const count =
          typeof s._count === 'object' && s._count ? s._count.rating : 0;
        return sum + (count || 0);
      }, 0);
    const commentsCount = (() => {
      const nullRatingGroup = stats.find((s) => s.rating === null);
      if (
        nullRatingGroup &&
        typeof nullRatingGroup._count === 'object' &&
        nullRatingGroup._count
      ) {
        return nullRatingGroup._count.rating || 0;
      }
      return 0;
    })();

    return new CommentListResponseDto(
      items.map((c) => new CommentResponseDto(c, params.currentUserId)),
      {
        page,
        limit,
        total,
        ratingsCount,
        commentsCount,
      },
    );
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    const existing = await this.prisma.comment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Comment not found');
    if (existing.userId !== userId)
      throw new ForbiddenException('Access denied');
    if (existing.deletedAt) throw new NotFoundException('Comment not found');

    return await this.prisma.$transaction(async (tx) => {
      const comment = await tx.comment.update({
        where: { id },
        data: {
          content: dto.content ?? undefined,
          rating: dto.rating !== undefined ? dto.rating : undefined,
          imageUrls: dto.imageUrls ?? undefined,
          updatedAt: new Date(),
        },
        include: this.getCommentIncludes(),
      });

      // Update recipe stats if rating changed
      if (dto.rating !== undefined) {
        await this.updateRecipeRatingStats(tx, existing.recipeId);
      }

      return new CommentResponseDto(comment);
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.comment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Comment not found');
    if (existing.userId !== userId)
      throw new ForbiddenException('Access denied');
    if (existing.deletedAt) throw new NotFoundException('Comment not found');

    await this.prisma.$transaction(async (tx) => {
      // Soft delete comment
      await tx.comment.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // If this was a rating, update recipe stats
      if (existing.rating) {
        await this.updateRecipeRatingStats(tx, existing.recipeId);
      }
    });

    this.logger.log(`Comment ${id} soft deleted`);
  }

  // Mark comment as helpful
  async toggleHelpful(
    commentId: string,
    userId: string,
  ): Promise<{ helpful: boolean; helpfulCount: number }> {
    return await this.prisma.$transaction(async (tx) => {
      const existingVote = await tx.commentHelpful.findUnique({
        where: { commentId_userId: { commentId, userId } },
      });

      let helpful: boolean;

      if (existingVote) {
        await tx.commentHelpful.delete({
          where: { commentId_userId: { commentId, userId } },
        });
        await tx.comment.update({
          where: { id: commentId },
          data: { helpfulCount: { decrement: 1 } },
        });
        helpful = false;
      } else {
        await tx.commentHelpful.create({
          data: { commentId, userId },
        });
        await tx.comment.update({
          where: { id: commentId },
          data: { helpfulCount: { increment: 1 } },
        });
        helpful = true;
      }

      const comment = await tx.comment.findUnique({
        where: { id: commentId },
        select: { helpfulCount: true },
      });

      return { helpful, helpfulCount: comment?.helpfulCount || 0 };
    });
  }

  // Get recipe rating summary (calculated from comments with ratings)
  async getRatingsSummary(recipeId: string): Promise<RatingSummaryDto> {
    const [ratingStats, totalRatings] = await this.prisma.$transaction([
      this.prisma.comment.groupBy({
        by: ['rating'],
        where: {
          recipeId,
          rating: { not: null },
          deletedAt: null,
        },
        _count: { rating: true },
        orderBy: { rating: 'desc' },
      }),

      this.prisma.comment.count({
        where: {
          recipeId,
          rating: { not: null },
          deletedAt: null,
        },
      }),
    ]);

    // Calculate stats
    const distribution = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
    let totalScore = 0;

    ratingStats.forEach((stat) => {
      if (stat.rating) {
        const count =
          typeof stat._count === 'object' && stat._count
            ? stat._count.rating
            : 0;
        distribution[stat.rating.toString()] = count || 0;
        totalScore += stat.rating * (count || 0);
      }
    });

    const averageRating =
      totalRatings > 0 ? Number((totalScore / totalRatings).toFixed(1)) : 0;

    return {
      averageRating,
      totalRatings,
      ratingDistribution: distribution,
    };
  }

  // Check if user can rate this recipe
  async canUserRate(userId: string, recipeId: string): Promise<boolean> {
    try {
      const recipe = await this.prisma.recipe.findUnique({
        where: { id: recipeId },
        select: { id: true, authorId: true },
      });

      if (!recipe) return false;
      if (recipe.authorId === userId) return false; // Can't rate own recipe

      // Check if already rated
      const existingRating = await this.prisma.comment.findFirst({
        where: {
          recipeId,
          userId,
          rating: { not: null },
          deletedAt: null,
        },
      });

      return !existingRating;
    } catch (error) {
      this.logger.error(`Error checking if user can rate: ${error.message}`);
      return false;
    }
  }

  // Get current user's rating for a recipe
  async getUserRating(userId: string, recipeId: string) {
    try {
      const rating = await this.prisma.comment.findFirst({
        where: {
          recipeId,
          userId,
          rating: { not: null },
          deletedAt: null,
        },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });

      if (!rating) return null;

      return {
        id: rating.id,
        score: rating.rating,
        comment: rating.content,
        imageUrls: rating.imageUrls,
        helpfulCount: rating.helpfulCount,
        user: {
          id: rating.user.id,
          name: rating.user.name || 'Anonymous User',
          avatarUrl: rating.user.avatarUrl,
        },
        createdAt: rating.createdAt,
        updatedAt: rating.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Error getting user rating: ${error.message}`);
      throw error;
    }
  }

  // Helper: Update recipe rating stats
  private async updateRecipeRatingStats(tx: any, recipeId: string) {
    const aggregation = await tx.comment.aggregate({
      where: {
        recipeId,
        rating: { not: null },
        deletedAt: null,
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await tx.recipe.update({
      where: { id: recipeId },
      data: {
        ratingAvg: aggregation._avg.rating ?? 0,
        ratingCount: aggregation._count.rating ?? 0,
      },
    });
  }

  // Helper: Get comment includes (simplified for now)
  private getCommentIncludes() {
    return {
      user: {
        select: { id: true, name: true, avatarUrl: true },
      },
    };
  }

  async updateImage(
    id: string,
    files: Express.Multer.File[],
    requesterId?: string,
  ): Promise<CommentResponseDto> {
    const existing = await this.prisma.comment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Recipe not found');
    if (requesterId && existing.userId !== requesterId) {
      throw new ForbiddenException('Access denied');
    }

    const uploadResult = await this.imageService.uploadImages(
      files,
      {
        folder: 'comments',
        prefix: 'comment-update-',
        maxSize: 5 * 1024 * 1024, // 5MB per image
        allowedTypes: ['jpg', 'jpeg', 'png', 'webp'],
      },
      requesterId,
    );

    const comment = await this.prisma.comment.update({
      where: { id },
      data: { imageUrls: uploadResult.map((result) => result.url) },
      include: this.getCommentIncludes(),
    });

    return new CommentResponseDto(comment, requesterId);
  }
}
