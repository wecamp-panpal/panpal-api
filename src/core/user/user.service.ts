import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PrismaService } from '../../common/prisma.service';
import { SupabaseService } from '../../common/supabase.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Kiểm tra email đã tồn tại
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);

    // Tạo user mới
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash,
        name: createUserDto.name,
        avatarUrl: createUserDto.avatarUrl,
        role: createUserDto.role || 'user',
      },
    });

    return new UserResponseDto(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => new UserResponseDto(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return new UserResponseDto(user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findOrCreateOAuthUser(input: {
    email: string;
    name?: string;
    avatarUrl?: string;
  }): Promise<UserResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      return new UserResponseDto(existing);
    }

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: 'oauth:google',
        name: input.name,
        avatarUrl: input.avatarUrl,
        role: 'user',
      },
    });

    return new UserResponseDto(user);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    return new UserResponseDto(user);
  }

  async remove(id: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }

  async updateAvatar(
    id: string,
    file: Express.Multer.File,
  ): Promise<UserResponseDto> {
    if (!file) {
      throw new Error('File is required');
    }
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const contentType = file?.mimetype;
    const extension = (contentType && contentType.split('/')[1]) || 'png';
    const filePath = `avatars/${id}.${extension}`;

    const publicUrl = await this.supabase.uploadPublic(
      filePath,
      file.buffer,
      contentType || 'image/png',
    );

    const user = await this.prisma.user.update({
      where: { id },
      data: { avatarUrl: publicUrl },
    });

    return new UserResponseDto(user);
  }
}
