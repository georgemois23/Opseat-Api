import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { VehicleType } from '../entities/courier.entity'; // Adjust path as needed

export class CreateCourierDto {
//   @IsUUID()
//   userId: string;

  @IsEnum(VehicleType)
  @IsOptional()
  vehicleType?: VehicleType;

  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  country?: string;

}