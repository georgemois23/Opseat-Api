// src/socket/socket.module.ts
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocketGateway } from './socket.gateway';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { Order } from '../order/entities/order.entity';

@Global() // Making it global allows you to use it everywhere easily
@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([Order])],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}