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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { RecipeListResponseDto } from '../recipe/dto/recipe-response.dto';

class ToggleFavoriteDto {
  recipeId: string;
}

@Controller('favorites')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post()
  
  @ApiOperation({ summary: 'Add favorite' })
  async add(@Request() req, @Body() dto: ToggleFavoriteDto): Promise<void> {
    return this.favoriteService.add(req.user.id, dto.recipeId);
  }

  @Delete()
    
  @ApiOperation({ summary: 'Remove favorite' })
  async remove(
    @Request() req,
    @Query('recipeId') recipeId: string,
  ): Promise<void> {
    return this.favoriteService.remove(req.user.id, recipeId);
  }

  @Get()
  
  @ApiOperation({ summary: 'List my favorites' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
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
  
  @ApiOperation({ summary: 'List my favourite recipes (full Recipe DTOs)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
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
