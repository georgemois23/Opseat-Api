
import { ApplicationStatus } from "../../common/enums/application-status.enum";
import { User } from "../../users/entities/users.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
export enum VehicleType {
  BIKE = 'bike',
  CAR = 'car',
  SCOOTER = 'scooter',
  OTHER = 'other',
}
@Entity()
export class Courier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.courierProfile)
  @JoinColumn() // Only the Courier side needs this
  user: User;

  @Column({ type: 'enum', enum: VehicleType, default: VehicleType.BIKE })
  vehicleType: VehicleType;

  @Column({ nullable: true })
  street?: string;
  @Column({ nullable: true })
  city?: string;
  @Column({ nullable: true })
  postalCode?: string;
  @Column({ nullable: true })
  country?: string;

  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.PENDING })
  applicationStatus: ApplicationStatus;
  
  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @DeleteDateColumn({type: 'timestamptz', nullable: true })
  deletedAt?: Date;  

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;  

  @Column({ type: 'float', nullable: true })
  currentLat: number;

  @Column({ type: 'float', nullable: true })
  currentLng: number;

  @Column({ default: true })
  isAvailable: boolean; // Not currently on a delivery

  @Column({ default: false })
  isOnline: boolean;
}