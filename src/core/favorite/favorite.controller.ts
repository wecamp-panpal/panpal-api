import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { JwtAuthGuard } from '../../base/auth/guards/jwt-auth.guard';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiProperty,
} from '@nestjs/swagger';
import { RecipeListResponseDto } from '../recipe/dto/recipe-response.dto';
import { IsNotEmpty, IsString } from 'class-validator';

class ToggleFavoriteDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Recipe ID to add to favorites',
    example: 'ebc48b57-fbae-4bb4-b5a8-d662040178ae'
  })
  recipeId: string;
}

@ApiTags('Favorites')
@ApiBearerAuth()
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post()
  @ApiOperation({
    summary: 'Add recipe to favorites',
    description: "Add a recipe to the authenticated user's favorite list",
  })
  @ApiBody({
    type: ToggleFavoriteDto,
    description: 'Recipe information to add to favorites',
    examples: {
      example1: {
        summary: 'Add recipe to favorites',
        value: {
          recipeId: '507f1f77bcf86cd799439011',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Recipe successfully added to favorites',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid recipe ID or recipe already in favorites',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Recipe not found',
  })
  async add(@Request() req, @Body() dto: ToggleFavoriteDto): Promise<void> {
    return this.favoriteService.add(req.user.id, dto.recipeId);
  }

  @Delete()
  @ApiOperation({
    summary: 'Remove recipe from favorites',
    description: "Remove a recipe from the authenticated user's favorite list",
  })
  @ApiQuery({
    name: 'recipeId',
    required: true,
    description: 'ID of the recipe to remove from favorites',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Recipe successfully removed from favorites',
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
    description: 'Recipe not found in favorites',
  })
  async remove(
    @Request() req,
    @Query('recipeId') recipeId: string,
  ): Promise<void> {
    return this.favoriteService.remove(req.user.id, recipeId);
  }

  @Get()
  @ApiOperation({
    summary: 'List user favorites',
    description:
      "Get a paginated list of the authenticated user's favorite recipe IDs",
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
    description: 'Number of items per page (default: 10, max: 100)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'List of favorite recipe IDs with pagination info',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              recipeId: { type: 'string', example: '507f1f77bcf86cd799439012' },
              userId: { type: 'string', example: '507f1f77bcf86cd799439013' },
              createdAt: { type: 'string', format: 'date-time' },
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
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  async list(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.favoriteService.list(req.user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Get('recipes')
  @ApiOperation({
    summary: 'List favorite recipes with full details',
    description:
      "Get a paginated list of the authenticated user's favorite recipes with complete recipe information",
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
    description: 'Number of items per page (default: 10, max: 100)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'List of favorite recipes with full recipe details',
    type: RecipeListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  async listRecipes(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<RecipeListResponseDto> {
    return this.favoriteService.listRecipes(req.user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }
}
