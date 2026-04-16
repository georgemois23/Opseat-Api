import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as dotenv from 'dotenv';;
import { ScheduleModule } from '@nestjs/schedule';
import { KeepAliveService } from './keep-alive/keep-alive.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/entities/users.entity';
import { UserAddressController } from './users/userAddress/userAddress.controller';
import { UserAddress } from './users/userAddress/entities/UserAddress.entity';
import { UserAddressModule } from './users/userAddress/userAddress.module';
import { GeolocationModule } from './geolocation/geolocation.module';
import { RestaurantModule } from './restaurants/restaurant.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/guards/auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { MenuModule } from './restaurants/menu/menu.module';
import { OrderModule } from './order/order.module';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    // TypeORM global connection
    ConfigModule.forRoot({
      isGlobal: true, 
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,       
      ssl: isProduction ? { rejectUnauthorized: false } : false,       
      entities: [__dirname + '/**/*.entity{.ts,.js}'],       
      logging: true,          
      autoLoadEntities: true,
      synchronize: false,
      extra: {
      prepareThreshold: 0,
      max: 1, 
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    },
      migrationsRun: false, 
    }),
    TypeOrmModule.forFeature([User]),
    ScheduleModule.forRoot(),
    UsersModule,    
    AuthModule, 
    UserAddressModule,
    RestaurantModule,
    GeolocationModule,
    MenuModule,
    OrderModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AppService, KeepAliveService, 

    {
      provide: APP_GUARD,
      useClass: AuthGuard,   // Runs first on every request
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,  // Runs second on every request
    },
  ],
})
export class AppModule {}
