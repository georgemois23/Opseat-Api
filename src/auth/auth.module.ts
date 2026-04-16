import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule} from '@nestjs/jwt';
import { JWT_SECRET } from 'src/configs/jwt-secret';
import { PassportModule } from '@nestjs/passport';
import { PassportAuthController } from './passport-auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
// import { EmailModule } from 'src/email/email.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/users.entity';
import { UsersService } from 'src/users/users.service';
import { RestaurantUser } from 'src/restaurant-user/entities/restaurantUser.entity';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  providers: [AuthService, LocalStrategy, GoogleStrategy],
  controllers: [AuthController, PassportAuthController],
  imports: [UsersModule,
    JwtModule.register({
      global: true,
      secret: JWT_SECRET,
      signOptions: { expiresIn: '59m' },
    }),
    PassportModule,
    
    // EmailModule,
    TypeOrmModule.forFeature([User,RestaurantUser]),
  ],
})
export class AuthModule {}
