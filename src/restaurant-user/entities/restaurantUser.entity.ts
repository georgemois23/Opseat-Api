import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, UpdateDateColumn, DeleteDateColumn, CreateDateColumn } from "typeorm";
import { Restaurant } from "../../restaurants/entities/restaurant.entity";
import { User } from "../../users/entities/users.entity";

export enum ApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

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

  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.PENDING })
  applicationStatus: ApplicationStatus;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
  
    @DeleteDateColumn({type: 'timestamptz', nullable: true })
    deletedAt?: Date;  

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;  
}