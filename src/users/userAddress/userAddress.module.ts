import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../users/entities/users.entity';
import { UserAddress } from './entities/UserAddress.entity';
import { UserAddressService } from './userAddress.service';
import { UserAddressController } from './userAddress.controller';
import { UsersModule } from '../users.module';
import { HttpModule } from '@nestjs/axios';
import { GeolocationModule } from 'src/geolocation/geolocation.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserAddress]),UsersModule, HttpModule, GeolocationModule],
  controllers: [UserAddressController],
  providers: [UserAddressService],
  exports: [UserAddressService],
})
export class UserAddressModule {}
