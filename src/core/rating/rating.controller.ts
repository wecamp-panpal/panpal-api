import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../base/auth/guards/jwt-auth.guard';
import { RatingService } from './rating.service';
import {
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
  ApiProperty,
} from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsArray,
} from 'class-validator';

class UpsertRatingDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Recipe ID to rate',
    example: 'ebc48b57-fbae-4bb4-b5a8-d662040178ae',
  })
  recipeId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @ApiProperty({
    description: 'Rating score from 1 to 5 stars',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  score: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: 'Array of image URLs for review photos (optional)',
    type: [String],
    required: false,
    example: [
      'https://example.com/review-photo1.jpg',
      'https://example.com/review-photo2.jpg',
    ],
  })
  imageUrls?: string[];

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Review comment (optional)',
    required: false,
    example:
      'This recipe was amazing! Very easy to follow and delicious results.',
  })
  comment?: string;
}

@ApiTags('Ratings')
@ApiBearerAuth()
@Controller('ratings')
@ApiBearerAuth()
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create or update rating for a recipe',
    description:
      'Submit a rating (1-5 stars) for a recipe. If user has already rated this recipe, the rating will be updated. Optionally include review photos and comment.',
  })
  @ApiBody({
    type: UpsertRatingDto,
    description: 'Rating data including score, optional images and comment',
    examples: {
      basicRating: {
        summary: 'Basic rating (stars only)',
        value: {
          recipeId: 'ebc48b57-fbae-4bb4-b5a8-d662040178ae',
          score: 5,
        },
      },
      fullReview: {
        summary: 'Complete review with photos and comment',
        value: {
          recipeId: 'ebc48b57-fbae-4bb4-b5a8-d662040178ae',
          score: 4,
          imageUrls: [
            'https://example.com/my-cooking-result1.jpg',
            'https://example.com/my-cooking-result2.jpg',
          ],
          comment:
            'Great recipe! Easy to follow and tasty results. Added a bit more spice to my taste.',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Rating successfully created or updated',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid rating data (score must be 1-5, recipe must exist)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Recipe not found',
  })
  async upsert(@Request() req, @Body() dto: UpsertRatingDto) {
    return this.ratingService.upsert(
      req.user.id,
      dto.recipeId,
      dto.score,
      dto.imageUrls,
      dto.comment,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get ratings for a recipe',
    description:
      'Retrieve a paginated list of all ratings and reviews for a specific recipe, including user details, scores, comments, and review photos.',
  })
  @ApiQuery({
    name: 'recipeId',
    required: true,
    description: 'ID of the recipe to get ratings for',
    example: 'ebc48b57-fbae-4bb4-b5a8-d662040178ae',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of ratings per page (default: 10, max: 50)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'List of ratings with pagination info',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'rating-uuid' },
              recipeId: { type: 'string', example: 'recipe-uuid' },
              userId: { type: 'string', example: 'user-uuid' },
              score: { type: 'number', example: 4, minimum: 1, maximum: 5 },
              comment: { type: 'string', example: 'Great recipe!' },
              imageUrls: {
                type: 'array',
                items: { type: 'string' },
                example: ['https://example.com/photo1.jpg'],
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string', example: 'John Doe' },
                  avatarUrl: {
                    type: 'string',
                    example: 'https://example.com/avatar.jpg',
                  },
                },
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 25 },
            totalPages: { type: 'number', example: 3 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid recipe ID or pagination parameters',
  })
  async list(
    @Query('recipeId') recipeId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ratingService.list(recipeId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Delete(':recipeId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Delete my rating for a recipe',
    description:
      "Remove the authenticated user's rating for a specific recipe. This performs a soft delete, preserving the rating data but excluding it from queries.",
  })
  @ApiQuery({
    name: 'recipeId',
    required: true,
    description: 'ID of the recipe to remove rating from',
    example: 'ebc48b57-fbae-4bb4-b5a8-d662040178ae',
  })
  @ApiResponse({
    status: 200,
    description: 'Rating successfully deleted',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid recipe ID',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Rating not found for this user and recipe',
  })
  async remove(@Request() req, @Param('recipeId') recipeId: string) {
    return this.ratingService.remove(req.user.id, recipeId);
  }
}
