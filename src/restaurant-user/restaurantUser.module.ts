import { Module, Res } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { RestaurantModule } from 'src/restaurants/restaurant.module';
import { MenuItem } from 'src/restaurants/menu/entities/menuItem.entity';
import { RestaurantUser } from './entities/restaurantUser.entity';
import { RestaurantUserController } from './restaurantUser.controller';
import { RestaurantUserService } from './restaurantUser.service';

@Module({
    imports: [TypeOrmModule.forFeature([Restaurant, RestaurantUser]), RestaurantModule],
    controllers: [RestaurantUserController],
    providers: [RestaurantUserService],
    exports: [RestaurantUserService],
})
export class RestaurantUserModule {}