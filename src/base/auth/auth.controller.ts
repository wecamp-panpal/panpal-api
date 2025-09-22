import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Headers
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/create-auth.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserResponseDto } from '../../core/user/dto/user-response.dto';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
// For Firebase
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { FirebaseAuthService } from './services/firebase-auth.service';
import { FirebaseUser } from './decorators/firebase-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private firebaseAuthService:FirebaseAuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @HttpCode(HttpStatus.OK)
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'Login a user' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Get profile of a user' })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req): UserResponseDto {
    return req.user;
  }

  @ApiOperation({ summary: 'Google OAuth - redirect to consent screen' })
  @HttpCode(HttpStatus.OK)
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Request() req) {
    return {
      message: 'Logged in with Google',
      user: req.user,
    };
  }

  @ApiOperation({ summary: 'Google OAuth callback' })
  @HttpCode(HttpStatus.OK)
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Request() req): Promise<AuthResponseDto> {
    return this.authService.googleLogin(req.user);
  }

  @ApiOperation({ summary: 'Firebase OAuth login' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid Firebase token' })

  @HttpCode(HttpStatus.OK)
  @Post('firebase/oauth')
  @UseGuards(FirebaseAuthGuard)
  async firebaseLogin(@FirebaseUser() firebaseUser: any) {
        return this.firebaseAuthService.loginWithFirebase(firebaseUser);
  }
}
