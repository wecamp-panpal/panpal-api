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
} from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import {
  RecipeResponseDto,
  RecipeListResponseDto,
} from './dto/recipe-response.dto';
import { JwtAuthGuard } from '../../base/auth/guards/jwt-auth.guard';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('recipes')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new recipe' })
  async create(
    @Request() req,
    @Body() dto: CreateRecipeDto,
  ): Promise<RecipeResponseDto> {
    return this.recipeService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List recipes' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'List recipes' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async findAll(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ): Promise<RecipeListResponseDto> {
    return this.recipeService.findAll(
      {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        category,
        search,
      },
      req.user?.id,
    );
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
    @Body() dto: UpdateRecipeDto,
  ): Promise<RecipeResponseDto> {
    return this.recipeService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a recipe' })
  @ApiResponse({ status: 200, description: 'Delete a recipe' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.recipeService.remove(id);
  }

  @Post(':id/image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload or update recipe image' })
  @ApiResponse({ status: 200, description: 'Image updated successfully' })
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<RecipeResponseDto> {
    return this.recipeService.updateImage(id, file);
  }
}
