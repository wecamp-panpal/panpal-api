import { DecodedToken } from './../../../../node_modules/firebase-admin/lib/utils/jwt.d';
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import {admin} from "../../../common/firebase-admin.config";
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        
        // Try to get token from Authorization header first
        let idToken = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            idToken = authHeader.split('Bearer ')[1];
        }
        
        // If not in header, try to get from body
        if (!idToken && request.body) {
            idToken = request.body.token || request.body.idToken;
        }
        
        if (!idToken) {
            throw new UnauthorizedException('No token provided');
        }
        
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            request.firebaseUser = decodedToken;
            return true;
        } catch (error) {
            console.error('Firebase token verification error:', error);
            throw new UnauthorizedException('Invalid token');
        }
    }
}