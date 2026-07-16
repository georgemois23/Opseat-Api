import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { RestaurantModule } from '../restaurants/restaurant.module';
import { OrderItem } from './entities/orderItem.entity';
import { MenuItem } from '../restaurants/menu/entities/menuItem.entity';
import { CourierModule } from 'src/couriers/courier.module';

@Module({
    imports: [TypeOrmModule.forFeature([Order, OrderItem, Restaurant, MenuItem]), RestaurantModule,forwardRef(() => CourierModule)],
    controllers: [OrderController],
    providers: [OrderService],
    exports: [OrderService],
})
export class OrderModule {}