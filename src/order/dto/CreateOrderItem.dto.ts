import { IsUUID, IsInt, Min, IsArray, ValidateNested, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemIngredientDto } from './CreateOrderItemIngredient.dto';

export class CreateOrderItemDto {
  @IsUUID()
  menuItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  comment?: string; // Users can now pass instructions here

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemIngredientDto)
  ingredients?: CreateOrderItemIngredientDto[];
}