import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AvatarImageInterceptor } from '../../base/image';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../../base/auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard) // Bảo vệ tất cả endpoints
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users fetched successfully' })
  async findAll(): Promise<UserResponseDto[]> {
    return this.userService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'User fetched successfully' })
  getMe(@Request() req): UserResponseDto {
    return req.user;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ status: 200, description: 'User fetched successfully' })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user by id' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by id' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(id);
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Upload or update user avatar' })
  @ApiResponse({ status: 200, description: 'Avatar updated successfully' })
  @UseInterceptors(AvatarImageInterceptor())
  @ApiConsumes('multipart/form-data')
  async uploadAvatar(
    @Request() req,
    @UploadedFile() avatar: Express.Multer.File,
  ): Promise<UserResponseDto> {
    return this.userService.updateAvatar(req.user.id, avatar);
  }
}
