import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class RatingService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(
    userId: string,
    recipeId: string,
    score: number,
    imageUrls?: string[],
    comment?: string,
  ) {
    if (typeof score !== 'number' || score < 1 || score > 5) {
      throw new BadRequestException('Score must be between 1 and 5');
    }

    // Use transaction to ensure data consistency and avoid race conditions
    return await this.prisma.$transaction(async (tx) => {
      // Verify recipe exists
      const recipe = await tx.recipe.findUnique({
        where: { id: recipeId },
      });
      if (!recipe) throw new NotFoundException('Recipe not found');

      // Upsert the rating
      await tx.rating.upsert({
        where: { recipeId_userId: { recipeId, userId } },
        create: {
          recipeId,
          userId,
          score,
          imageUrls: imageUrls || [],
          comment: comment || null,
        },
        update: {
          score,
          imageUrls: imageUrls || [],
          comment: comment || null,
          deletedAt: null,
          updatedAt: new Date(),
        },
      });

      // Recalculate average and count (exclude soft deleted) in same transaction
      const agg = await tx.rating.aggregate({
        where: {
          recipeId,
          deletedAt: null,
        },
        _avg: { score: true },
        _count: { score: true },
      });

      // Update recipe statistics
      await tx.recipe.update({
        where: { id: recipeId },
        data: {
          ratingAvg: agg._avg.score ?? 0,
          ratingCount: agg._count.score ?? 0,
        },
      });

      return { success: true };
    });
  }

  async list(recipeId: string, params: { page?: number; limit?: number }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.rating.findMany({
        where: {
          recipeId,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      this.prisma.rating.count({
        where: {
          recipeId,
          deletedAt: null,
        },
      }),
    ]);
    return {
      items: items.map((r) => ({
        id: r.id,
        score: r.score,
        imageUrls: r.imageUrls,
        comment: r.comment,
        user: r.user,
        createdAt: r.createdAt,
      })),
      page,
      limit,
      total,
    };
  }

  async remove(userId: string, recipeId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const rating = await tx.rating.findUnique({
        where: { recipeId_userId: { recipeId, userId } },
      });
      if (!rating) throw new NotFoundException('Rating not found');
      if (rating.deletedAt) throw new NotFoundException('Rating not found');

      // Soft delete
      await tx.rating.update({
        where: { recipeId_userId: { recipeId, userId } },
        data: { deletedAt: new Date() },
      });

      // Recalculate average and count (exclude soft deleted) in same transaction
      const agg = await tx.rating.aggregate({
        where: {
          recipeId,
          deletedAt: null,
        },
        _avg: { score: true },
        _count: { score: true },
      });

      await tx.recipe.update({
        where: { id: recipeId },
        data: {
          ratingAvg: agg._avg.score ?? 0,
          ratingCount: agg._count.score ?? 0,
        },
      });

      return { success: true };
    });
  }
}
