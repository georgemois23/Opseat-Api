import { IsUUID, IsNotEmpty, IsNumber, IsBoolean, IsOptional, Min, IsString, IsEnum } from 'class-validator';
import { IngredientCategory } from '../entities/ingredient.entity';

export class CreateMenuItemIngredientDto {
  @IsUUID()
  @IsNotEmpty()
  menuItemId: string;

  @IsUUID()
  @IsNotEmpty()
  ingredientId: string;

  @IsString()
  @IsOptional()
  newIngredientName?: string;

  @IsEnum(IngredientCategory)
  @IsOptional()
  newIngredientCategory?: IngredientCategory;

  @IsNumber()
  @IsOptional()
  @Min(0)
  quantity?: number;

  @IsBoolean()
  @IsOptional()
  required?: boolean;
}