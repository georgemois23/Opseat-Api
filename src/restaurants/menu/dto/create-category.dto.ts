import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  // @IsUUID()
  // @IsNotEmpty()
  // menuId: string; // We usually pass the ID of the parent entity

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}