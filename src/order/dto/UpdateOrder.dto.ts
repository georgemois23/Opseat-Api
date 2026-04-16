import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderCartLineDto } from './OrderCartLine.dto';


export class UpdateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderCartLineDto)
  items: OrderCartLineDto[];
}