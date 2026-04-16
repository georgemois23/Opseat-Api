import { Type } from 'class-transformer';
import { IsArray, ValidateNested, IsString, IsNotEmpty, IsNumber, IsUUID, IsOptional, IsBoolean, IsEnum, IsUrl, ValidateIf } from 'class-validator';
import { IngredientCategory } from '../entities/ingredient.entity';

class IngredientRecipeDto {
  @IsUUID()
  @IsOptional()
  ingredientId?: string; // For existing ingredients

  @IsString()
  @IsOptional()
  name?: string; // For new ingredients

  @IsEnum(IngredientCategory)
  @IsOptional()
  category?: IngredientCategory;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsBoolean()
  @IsOptional()
  required?: boolean;
}

export class CreateFullMenuItemDto {
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsOptional()
  description?: string;

    @IsOptional()
@ValidateIf((obj, value) => value !== '') // Skip validation if value is an empty string
@IsUrl()
imageUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientRecipeDto)
  ingredients: IngredientRecipeDto[];
}