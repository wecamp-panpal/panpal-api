import { Injectable } from "@nestjs/common";
import { AuthService } from "../auth.service";

@Injectable()
export class FirebaseAuthService {
  constructor(private readonly authService: AuthService) {}

  async loginWithFirebase(decodedToken: any) {
    // Handle user login/creation
    const user = await this.authService.handleFirebaseUser(decodedToken);
    
    // Generate JWT tokens
    const tokens = await this.authService.generateAccessToken(user);
    
    return {
      token: tokens.access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        picture: user.picture,
      }
    };
  }
}