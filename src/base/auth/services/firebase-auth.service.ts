import { Injectable } from "@nestjs/common";
import { AuthService } from "../auth.service";
import { UnauthorizedException } from "@nestjs/common";
import { AuthResponseDto } from "../dto/auth-response.dto";

@Injectable()
export class FirebaseAuthService {
  constructor(private readonly authService: AuthService) {}

  async loginWithFirebase(decodedToken: any): Promise<AuthResponseDto> {
    try {
      return this.authService.firebaseLogin(decodedToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }
}