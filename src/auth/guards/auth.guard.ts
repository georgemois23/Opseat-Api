import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { UsersService } from "../../users/users.service";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private usersService: UsersService,
        private reflector: Reflector,
    ) {}
        

    async canActivate(context: ExecutionContext){
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
    ]);

    if (isPublic) {
        return true; // Let them in without a token!
    }
        const request = context.switchToHttp().getRequest();
        const authorization = request.headers.authorization;
        const token = request.cookies?.access_token;
        if(!token){
            throw new UnauthorizedException();
        }

         try {
            const tokenPayload = await this.jwtService.verifyAsync(token);
            const user = await this.usersService.findUserById(tokenPayload.sub);  
            if (!user) throw new UnauthorizedException();
            const { password, ...safeUser } = user;
            request.user = safeUser;
        } catch (error) {
            throw new UnauthorizedException();
        }

        return true;
    }
    }