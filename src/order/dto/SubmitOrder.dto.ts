import { IsString, IsNumber, IsOptional, IsLatitude, IsLongitude, IsNotEmpty, IsEnum } from 'class-validator';
import { DeliveryType } from '../entities/order.entity';

export class UpdateOrderAddressDto {
  @IsString()
  @IsOptional()
  deliveryAddress: string;

  @IsNumber()
  @IsLatitude()
  @IsOptional()
  deliveryLat: number;

  @IsNumber()
  @IsLongitude()
  @IsOptional()
  deliveryLng: number;

  @IsString()
  @IsOptional()
  deliveryNotes?: string;

  @IsEnum(DeliveryType)
  @IsOptional() // optional because entity has default value
  deliveryType?: DeliveryType;
}