import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateUserAddressDto {
  @IsString()
  label: string;

  @IsString()
  street: string;

  @IsString()
  streetNumber: string;

  @IsString()
  city: string;

  @IsString()
  country: string;

  @IsString()
  postalCode: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}