import { Type } from "class-transformer";
import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum, Min } from "class-validator";
import { CreateRestaurantScheduleDto } from "./create-restaurant-schedule.dto";
import { GreekRestaurantCategory } from "../entities/restaurant.entity";

export class CreateRestaurantDto {
    @IsString()
    name: string;

    @IsString()
    street: string;

    @IsString()
    city: string;

    @IsString()
    postalCode: string;

    @IsString()
    @IsOptional()
    country: string;

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number

    @IsNumber()
    deliveryRadius?: number;

    @IsArray()
    @ValidateNested({ each: true }) // Validates every item in the array
    @Type(() => CreateRestaurantScheduleDto) // Tells class-transformer how to parse the items
    schedules: CreateRestaurantScheduleDto[];

    @IsArray()
    @IsEnum(GreekRestaurantCategory, { each: true })
    categories: GreekRestaurantCategory[];

    @IsNumber()
    @Min(0)
    minimumOrderAmount: number;

}