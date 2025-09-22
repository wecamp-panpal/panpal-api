import { DecodedToken } from './../../../../node_modules/firebase-admin/lib/utils/jwt.d';
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import {admin} from "../../../common/firebase-admin.config";
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request=context.switchToHttp().getRequest();
        const authHeader=request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('No token provided');
        }
        const idToken=authHeader.split('Bearer ')[1];
        try{
            const decodedToken=await admin.auth().verifyIdToken(idToken);
            request.firebaseUser=decodedToken;
            return true;
        }
        catch(error){
            throw new UnauthorizedException('Invalid token');
        }

    }
}