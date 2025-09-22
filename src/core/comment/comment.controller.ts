import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import {
  CommentListResponseDto,
  CommentResponseDto,
  RatingSummaryDto,
} from './dto/comment-response.dto';
import { UploadImagesResponseDto } from './dto/upload-images.dto';
import { ImageService } from '../../base/image/image.service';
import { CommentImageInterceptor } from '../../base/image/image.interceptor';
import { JwtAuthGuard } from '../../base/auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';

@ApiTags('Comments & Rating')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create comment or rating',
    description:
      'Create a comment. Include "rating" field (1-5) to make it a rating comment.',
  })
  @ApiResponse({
    status: 201,
    description: 'Comment/rating created successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Request() req,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get comments and ratings for recipe',
    description:
      'Get unified feed of comments and ratings with flexible filtering and sorting',
  })
  @ApiQuery({ name: 'recipeId', required: true, description: 'Recipe ID' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['all', 'ratings', 'comments'],
    description: 'Filter by type: all, ratings only, or comments only',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['newest', 'oldest', 'most_helpful', 'highest_rated'],
    description: 'Sort order',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (max 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Comments and ratings retrieved successfully',
    type: CommentListResponseDto,
  })
  async findAll(
    @Query('recipeId') recipeId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: 'all' | 'ratings' | 'comments',
    @Query('sortBy')
    sortBy?: 'newest' | 'oldest' | 'most_helpful' | 'highest_rated',
    @Request() req?: any,
  ): Promise<CommentListResponseDto> {
    return this.commentService.findAll(recipeId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      type: type || 'all',
      sortBy: sortBy || 'newest',
      currentUserId: req?.user?.id,
    });
  }

  // Mark comment as helpful
  @Post(':id/helpful')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mark comment/rating as helpful',
    description: 'Toggle helpful status for a comment or rating',
  })
  @ApiResponse({
    status: 200,
    description: 'Helpful status updated',
    schema: {
      type: 'object',
      properties: {
        helpful: { type: 'boolean', example: true },
        helpfulCount: { type: 'number', example: 5 },
      },
    },
  })
  async toggleHelpful(
    @Param('id') commentId: string,
    @Request() req,
  ): Promise<{ helpful: boolean; helpfulCount: number }> {
    return this.commentService.toggleHelpful(commentId, req.user.id);
  }

  // Upload images for comments
  @Post(':id/images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(CommentImageInterceptor())
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload images for comments/ratings',
    description:
      'Upload up to 10 images to use in comments or ratings. Field name: "commentImage"',
  })
  @ApiResponse({
    status: 201,
    description: 'Images uploaded successfully',
    type: UploadImagesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'No files uploaded or invalid files',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadImages(
    @Param('id') commentId: string,
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<UploadImagesResponseDto> {
    return this.commentService.updateImage(commentId, files, req.user.id);
  }

  // Get rating statistics for a recipe
  @Get('ratings-summary')
  @ApiOperation({
    summary: 'Get rating statistics for recipe',
    description:
      'Get rating distribution and summary stats calculated from rating comments',
  })
  @ApiQuery({ name: 'recipeId', required: true })
  @ApiResponse({
    status: 200,
    description: 'Rating summary retrieved successfully',
    type: RatingSummaryDto,
  })
  async getRatingsSummary(
    @Query('recipeId') recipeId: string,
  ): Promise<RatingSummaryDto> {
    return this.commentService.getRatingsSummary(recipeId);
  }

  // Check if user can rate recipe
  @Get('can-rate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if user can rate this recipe' })
  @ApiQuery({ name: 'recipeId', required: true })
  async canUserRate(
    @Query('recipeId') recipeId: string,
    @Request() req,
  ): Promise<{ canRate: boolean }> {
    const canRate = await this.commentService.canUserRate(
      req.user.id,
      recipeId,
    );
    return { canRate };
  }

  // Get user's current rating for recipe
  @Get('my-rating')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user rating for recipe' })
  @ApiQuery({ name: 'recipeId', required: true })
  async getUserRating(@Query('recipeId') recipeId: string, @Request() req) {
    return this.commentService.getUserRating(req.user.id, recipeId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update comment or rating',
    description: 'Update content, rating, or images of a comment',
  })
  @ApiResponse({
    status: 200,
    description: 'Comment updated successfully',
    type: CommentResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete comment or rating',
    description:
      'Soft delete a comment or rating. If deleting a rating, recipe stats will be updated.',
  })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.commentService.remove(id, req.user.id);
  }
}
