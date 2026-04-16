import { UsersService } from '../users/users.service';
import { Controller, Get, HttpCode, HttpStatus, NotImplementedException, Post, Request, UseGuards, Body, UnauthorizedException, Res, Query, Req } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';
import { AuthService } from "./auth.service";
import { PassportLocalGuard } from "./guards/passport-local.guard";
import { AuthGuard } from './guards/auth.guard';
import type { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UserRole } from '../users/entities/users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RestaurantUser } from 'src/restaurant-user/entities/restaurantUser.entity';
import { Repository } from 'typeorm';
import { Public } from './decorators/public.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';


@Controller('auth')
export class PassportAuthController {
      constructor(
    private authService: AuthService,
    private jwtService: JwtService, 
    private usersService: UsersService,
    @InjectRepository(RestaurantUser) private RestaurantUserRepo: Repository<RestaurantUser>
  ) {}

    @HttpCode(HttpStatus.OK)
    @Public()
    @Post('login')
@UseGuards(PassportLocalGuard)
async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, userId } = await this.authService.signIn(req.user);

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 59 * 60 * 1000, 
    });

    res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, 
        path: '/auth/refresh',
    });

    return { userId };
}

    @Public()
    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async googleAuth(@Req() req) {}

  // 2. Google redirects back here with the user data
  @Public()
@Get('google/callback')
@UseGuards(GoogleAuthGuard)
async googleAuthRedirect(@Req() req, @Res() res: Response) {
  // 1. Get the tokens from your service
  const authResult = await this.authService.googleLogin(req.user);

  // 2. Attach the JWT to a cookie
  res.cookie('access_token', authResult.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 1000, // 1 hour
  });

  // Optional: If you use a refresh token cookie as well
  res.cookie('refresh_token', authResult.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // 3. Redirect the user back to your frontend
  return res.redirect(`${process.env.FRONTEND_URL}/home`); 
}
    
   @Get('me')
@UseGuards(AuthGuard)
async getUserInfo(@Request() request) {
  const { password, ...userWithoutPassword } = request.user;

  const isRestaurantUser = await this.RestaurantUserRepo.findOne({
    where: { user: { id: request.user.id } },
  });

  return {
    ...userWithoutPassword,
    isRestaurantUser: !!isRestaurantUser,
  };
}
    @Public()
    @Post('signup')
    async signup(
        @Body() input: {
            email: string;
            password: string;            
            first_name: string;
            last_name: string;
        },
    ) {
        return this.authService.register(input);
    }

    @Public()
    @Post('refresh')
async refresh(@Request() req, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException();

    const { accessToken, newRefreshToken } = await this.authService.refreshToken(refreshToken);

     const isProd = process.env.NODE_ENV === 'production';
    res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
         maxAge: 59 * 60 * 1000, 
    });

    res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, 
        path: '/auth/refresh',
    });

    return { ok: true };
}

@Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Res({ passthrough: true }) res: Response) {
        const isProd = process.env.NODE_ENV === 'production';

        // 1. Clear Access Token from ROOT
        res.clearCookie('access_token', {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            path: '/', 
        });

        // 2. Clear Refresh Token from SPECIFIC PATH
        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            path: '/auth/refresh', // <--- This was the error
        });

        return { message: 'Logged out successfully' };
    }


  @Public()
  @Post('forgot-password')
@HttpCode(HttpStatus.OK)
async forgotPassword(
  @Body('email') email: string,
) {
  await this.authService.forgotPassword(email);
  return {
    message:
      'If the provided credentials are registered, a reset link has been sent.',
  };
}

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    await this.authService.resetPassword(token, newPassword);
    return { message: 'Password has been reset successfully.' };
  }

  @Public()
  @Get('verify-reset-token')
  async verifyResetToken(@Query('token') token: string) {
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // Calls service to check if token is valid
    return this.authService.verifyResetToken(token);
  }


}
