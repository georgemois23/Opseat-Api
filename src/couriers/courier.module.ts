import { Courier } from './entities/courier.entity';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourierController } from './courier.controller';
import { CourierService } from './courier.service';
import { OrderModule } from 'src/order/order.module';
import { Order } from 'src/order/entities/order.entity';
import { CourierGateway } from './courier.gateway';

@Module({
    imports: [TypeOrmModule.forFeature([Courier]),forwardRef(() => OrderModule), ],
    controllers: [CourierController],
    providers: [CourierService, CourierGateway],
    exports: [CourierService],
})
export class CourierModule {}