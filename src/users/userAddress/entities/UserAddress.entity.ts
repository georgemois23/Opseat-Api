import { User } from "../../entities/users.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class UserAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.addresses)
  user: User;

  @Column({ default: 'Home' })
  label: string;

  @Column()
  street: string;

  @Column()
  streetNumber: string;

  @Column()
  city: string;

  @Column()
  postalCode: string;

  @Column({ nullable: true })
  country: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @Column({ nullable: true })
  phone?: string;

  @Column({ default: true })
  isDefault: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

  @DeleteDateColumn({type: 'timestamptz', nullable: true })
  deletedAt?: Date;  


}