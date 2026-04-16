import { 
  IsString, 
  IsNotEmpty, 
  IsEnum, 
  IsBoolean, 
  IsOptional, 
  IsUUID 
} from 'class-validator';
import { IngredientCategory } from '../entities/ingredient.entity';

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(IngredientCategory, {
    message: `Category must be one of: ${Object.values(IngredientCategory).join(', ')}`,
  })
  @IsOptional() // Optional because you have a default of 'OTHER' in the entity
  category?: IngredientCategory;

  @IsBoolean()
  @IsOptional()
  available?: boolean;

  @IsUUID()
  @IsNotEmpty()
  restaurantId: string;
}