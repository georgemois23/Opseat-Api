import { 
  IsUUID, 
  IsInt, 
  Min, 
  IsArray, 
  IsString, 
  IsNumber, 
  IsOptional 
} from 'class-validator';

export class OrderCartLineDto {
  @IsUUID()
  menuItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsString()
  @IsOptional()
  comment: string;

  @IsArray()
  @IsUUID('4', { each: true })
  ingredientIds: string[];
}