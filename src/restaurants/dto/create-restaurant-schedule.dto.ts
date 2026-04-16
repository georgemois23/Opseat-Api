import { IsEnum, IsString, IsBoolean, Matches } from "class-validator";
import { DayOfWeek } from "../restaurant-schedule/restaurant-schedule.entity"

export class CreateRestaurantScheduleDto {
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: "Time must be in HH:mm format" 
  })
  openTime: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: "Time must be in HH:mm format" 
  })
  closeTime: string;

  @IsBoolean()
  isClosed: boolean;
}