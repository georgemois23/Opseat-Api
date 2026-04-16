import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../users/entities/users.entity';
import { HttpModule } from '@nestjs/axios';
import { GeolocationModule } from 'src/geolocation/geolocation.module';
import { Restaurant } from '../entities/restaurant.entity';
import { RestaurantUser } from 'src/restaurant-user/entities/restaurantUser.entity';
import { MenuController } from './menu.controllers';
import { MenuService } from './menu.service';
import { UsersModule } from 'src/users/users.module';
import { Menu } from './entities/menu.entity';
import { Category } from './entities/category.entity';
import { Ingredient } from './entities/ingredient.entity';
import { MenuItem } from './entities/menuItem.entity';
import { MenuItemIngredient } from './entities/menuItemIngredient.entity';
import { RestaurantModule } from '../restaurant.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Restaurant, RestaurantUser, Menu, Category, Ingredient, MenuItem, MenuItemIngredient]),UsersModule, RestaurantModule],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
