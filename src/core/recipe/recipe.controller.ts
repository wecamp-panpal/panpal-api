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
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import {
  RecipeResponseDto,
  RecipeListResponseDto,
} from './dto/recipe-response.dto';
import { JwtAuthGuard } from '../../base/auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { RecipeImageInterceptor, StepImageInterceptor } from '../../base/image';

@Controller('recipes')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(RecipeImageInterceptor())
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new recipe with optional image upload' })
  @ApiResponse({ status: 201, description: 'Recipe created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(
    @Request() req,
    @Body() dto: CreateRecipeDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<RecipeResponseDto> {
    return this.recipeService.create(req.user.id, dto, image);
  }

  @Get()
  @ApiOperation({ summary: 'List recipes' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'authorId', required: false })
  @ApiResponse({ status: 200, description: 'List recipes' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async findAll(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('authorId') authorId?: string,
  ): Promise<RecipeListResponseDto> {
    return this.recipeService.findAll(
      {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        category,
        search,
        authorId,
      },
      req.user?.id,
    );
  }

  @Get('trending')
  @ApiOperation({
    summary: 'Get trending recipes',
    description: 'Get top recipes by rating count and average rating',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of trending recipes to return (default: 10, max: 50)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Trending recipes retrieved successfully',
    type: RecipeListResponseDto,
  })
  async getTrending(
    @Query('limit') limit?: string,
  ): Promise<RecipeListResponseDto> {
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit || '10', 10)));
    return this.recipeService.findTrending(parsedLimit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get recipe by id' })
  @ApiResponse({ status: 200, description: 'Get recipe by id' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async findOne(
    @Param('id') id: string,
    @Request() req,
  ): Promise<RecipeResponseDto> {
    return this.recipeService.findOne(id, req.user?.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a recipe' })
  @ApiResponse({ status: 200, description: 'Update a recipe' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateRecipeDto,
  ): Promise<RecipeResponseDto> {
    return this.recipeService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a recipe' })
  @ApiResponse({ status: 200, description: 'Delete a recipe' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.recipeService.remove(id, req.user.id);
  }

  @Post(':id/image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(RecipeImageInterceptor())
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload or update recipe image' })
  @ApiResponse({ status: 200, description: 'Image updated successfully' })
  async uploadImage(
    @Param('id') id: string,
    @Request() req,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<RecipeResponseDto> {
    return this.recipeService.updateImage(id, image, req.user.id);
  }

  @Post(':recipeId/steps/:stepId/image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(StepImageInterceptor())
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload image for a recipe step' })
  @ApiResponse({ status: 200, description: 'Step image updated successfully' })
  async uploadStepImage(
    @Param('recipeId') recipeId: string,
    @Param('stepId') stepId: string,
    @Request() req,
    @UploadedFile() stepImage: Express.Multer.File,
  ): Promise<{ success: boolean; imageUrl: string }> {
    return this.recipeService.updateStepImage(
      recipeId,
      stepId,
      stepImage,
      req.user.id,
    );
  }
}
