import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../core/user/user.service';
import { LoginDto, RegisterDto } from './dto/create-auth.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from '../../core/user/dto/user-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Kiểm tra user đã tồn tại
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Tạo user mới
    const user = await this.userService.create({
      email: registerDto.email,
      password: registerDto.password,
      name: registerDto.name,
    });

    // Tạo JWT token
    const accessToken = await this.generateAccessToken(user);

    return new AuthResponseDto(user, accessToken);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Tìm user theo email
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Kiểm tra password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Tạo JWT token
    const userResponse = new UserResponseDto(user);
    const accessToken = await this.generateAccessToken(userResponse);

    return new AuthResponseDto(userResponse, accessToken);
  }

  async validateUser(userId: string): Promise<UserResponseDto | null> {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    return new UserResponseDto(user);
  }

  private async generateAccessToken(user: UserResponseDto): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  async googleLogin(googleUser: {
    provider: 'google';
    providerId: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
  }): Promise<AuthResponseDto> {
    if (!googleUser?.email) {
      throw new UnauthorizedException('Google account has no email');
    }

    const user = await this.userService.findOrCreateOAuthUser({
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.avatarUrl,
    });

    const userResponse = new UserResponseDto(user);
    const accessToken = await this.generateAccessToken(userResponse);
    return new AuthResponseDto(userResponse, accessToken);
  }
}
