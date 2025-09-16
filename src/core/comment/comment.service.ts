import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import {
  CommentListResponseDto,
  CommentResponseDto,
} from './dto/comment-response.dto';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    // ensure recipe exists
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: dto.recipeId },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    const comment = await this.prisma.comment.create({
      data: {
        recipeId: dto.recipeId,
        userId,
        content: dto.content,
      },
      include: { user: true },
    });
    return new CommentResponseDto(comment);
  }

  async findAll(
    recipeId: string,
    params: { page?: number; limit?: number },
  ): Promise<CommentListResponseDto> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where: {
          recipeId,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { user: true },
      }),
      this.prisma.comment.count({
        where: {
          recipeId,
          deletedAt: null,
        },
      }),
    ]);

    return new CommentListResponseDto(
      items.map((c) => new CommentResponseDto(c)),
      {
        page,
        limit,
        total,
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
    if (existing.userId !== userId) throw new ForbiddenException('Not allowed');

    const comment = await this.prisma.comment.update({
      where: { id },
      data: { content: dto.content ?? undefined },
      include: { user: true },
    });
    return new CommentResponseDto(comment);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.comment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Comment not found');
    if (existing.userId !== userId) throw new ForbiddenException('Not allowed');
    if (existing.deletedAt) throw new NotFoundException('Comment not found');

    // Soft delete
    await this.prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
