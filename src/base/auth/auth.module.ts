import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UserModule } from '../../core/user/user.module';
import { FirebaseAuthService } from './services/firebase-auth.service';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, FirebaseAuthService, FirebaseAuthGuard],
  exports: [AuthService, FirebaseAuthService],
})
export class AuthModule {}
