import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RestaurantUser } from '../../restaurant-user/entities/restaurantUser.entity';
import { Courier } from '../../couriers/entities/courier.entity';
import { UserAddress } from '../userAddress/entities/UserAddress.entity';

export enum UserRole {
  USER = 'user',       // normal user (customer)
  ADMIN = 'admin',     // platform administrator
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, select: false })
  password: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ nullable: true })
  first_name?: string;

  @Column({ nullable: true })
  last_name?: string;

  @Column({ default: false })
  disabled: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  temporarily_disabled?: Date;

  @Column({ default: 0 })
  failedLoginAttempts: number;

  @Column({ default: false })
  is_guest: boolean;

  @Column({ type: 'varchar', nullable: true })
  resetToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpiry: Date | null;

  // Relations
  @OneToMany(() => RestaurantUser, (ru) => ru.user)
  restaurantLinks: RestaurantUser[];

  @OneToMany(() => Courier, (courier) => courier.user)
  courierProfiles: Courier[];

  @OneToMany(() => UserAddress, (addr) => addr.user)
  addresses: UserAddress[];
}