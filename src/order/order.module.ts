import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { RestaurantModule } from 'src/restaurants/restaurant.module';
import { OrderItem } from './entities/orderItem.entity';
import { MenuItem } from 'src/restaurants/menu/entities/menuItem.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Order, OrderItem, Restaurant, MenuItem]), RestaurantModule],
    controllers: [OrderController],
    providers: [OrderService],
    exports: [OrderService],
})
export class OrderModule {}