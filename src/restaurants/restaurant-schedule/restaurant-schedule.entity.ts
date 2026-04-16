import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Restaurant } from '../entities/restaurant.entity';
import { Exclude } from 'class-transformer';

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6
}

@Entity()
export class RestaurantSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: DayOfWeek,
    default: DayOfWeek.MONDAY
  })
  dayOfWeek: DayOfWeek;

  @Column({ type: 'time' })
  openTime: string; // HH:mm:ss

  @Column({ type: 'time' })
  closeTime: string;

  @Column({ default: true })
  isClosed: boolean; // For marking days like "Closed on Sundays"

  @Exclude()
  @ManyToOne(() => Restaurant, (restaurant) => restaurant.schedules)
  restaurant: Restaurant;
}