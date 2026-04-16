import { UserAddress } from './../users/userAddress/entities/UserAddress.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/users.entity';
import { UsersModule } from '../users/users.module';
import { RestaurantController } from './restaurant.controller';
import { UserAddressController } from 'src/users/userAddress/userAddress.controller';
import { RestaurantService } from './restaurant.service';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantUser } from 'src/restaurant-user/entities/restaurantUser.entity';
import { RestaurantSchedule } from './restaurant-schedule/restaurant-schedule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Restaurant, RestaurantUser, UserAddress, RestaurantSchedule]),UsersModule,],
  controllers: [RestaurantController],
  providers: [RestaurantService],
  exports: [RestaurantService],
})
export class RestaurantModule {}
