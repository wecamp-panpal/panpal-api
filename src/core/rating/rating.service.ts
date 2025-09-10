import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class RatingService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(userId: string, recipeId: string, score: number) {
    if (typeof score !== 'number' || score < 1 || score > 5) {
      throw new BadRequestException('Score must be between 1 and 5');
    }
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    await this.prisma.rating.upsert({
      where: { recipeId_userId: { recipeId, userId } },
      create: { recipeId, userId, score },
      update: { score },
    });

    // recalc average and count
    const agg = await this.prisma.rating.aggregate({
      where: { recipeId },
      _avg: { score: true },
      _count: { score: true },
    });
    await this.prisma.recipe.update({
      where: { id: recipeId },
      data: {
        ratingAvg: agg._avg.score ?? 0,
        ratingCount: agg._count.score ?? 0,
      },
    });

    return { success: true };
  }

  async list(recipeId: string, params: { page?: number; limit?: number }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.rating.findMany({
        where: { recipeId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      this.prisma.rating.count({ where: { recipeId } }),
    ]);
    return {
      items: items.map((r) => ({
        id: r.id,
        score: r.score,
        user: r.user,
        createdAt: r.createdAt,
      })),
      page,
      limit,
      total,
    };
  }
}
