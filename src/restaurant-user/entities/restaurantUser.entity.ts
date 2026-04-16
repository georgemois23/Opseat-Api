import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from "typeorm";
import { Restaurant } from "../../restaurants/entities/restaurant.entity";
import { User } from "../../users/entities/users.entity";

export enum RestaurantRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  STAFF = 'staff'
}

@Entity()
export class RestaurantUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.restaurantLinks)
  user: User;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.staff)
  restaurant: Restaurant;

  @Column({ type: 'enum', enum: RestaurantRole })
  role: RestaurantRole;
}