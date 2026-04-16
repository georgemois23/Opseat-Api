import { Body, Controller, HttpCode, HttpStatus, NotImplementedException, Post, Get, UseGuards, Req, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { UserRole } from '../users/entities/users.entity';

@Controller('auth-old')
export class AuthController {
    constructor(private authService: AuthService) {}

    @HttpCode(HttpStatus.OK)
    @Post('login')
    login(@Body() input: { email: string; password: string }) {
        return this.authService.authenticate(input);
    }

    @UseGuards(AuthGuard)
    @Get('me')
    getUserInfo(@Request() request) {
        return request.user;
    }

     @Post('signup')
    async signup(
        @Body() input: {
            email: string;
                    password: string;
                    first_name: string;
                    last_name: string;
                    role: UserRole;
        },
    ) {
        return this.authService.register(input);
    }
}
