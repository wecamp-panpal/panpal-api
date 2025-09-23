import { Injectable, UnauthorizedException, Logger} from "@nestjs/common";
import { AuthService } from "../auth.service";
import { AuthResponseDto } from "../dto/auth-response.dto";

@Injectable()
export class FirebaseAuthService {
  private readonly logger = new Logger(FirebaseAuthService.name);

  constructor(private readonly authService: AuthService) {}

  async loginWithFirebase(decodedToken: any): Promise<AuthResponseDto> {
    try {
      return await this.authService.firebaseLogin(decodedToken);
    } catch (error) {
      this.logger.error('Firebase login error:', error);
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }
}
