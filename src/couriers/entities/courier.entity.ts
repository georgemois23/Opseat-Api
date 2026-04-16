import { User } from "../../users/entities/users.entity";
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Courier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  user: User;

  @Column()
  vehicleType: string;

  @Column({ nullable: true })
  street?: string;
  @Column({ nullable: true })
  city?: string;
  @Column({ nullable: true })
  postalCode?: string;
  @Column({ nullable: true })
  country?: string;

  @Column({ default: false })
  approved: boolean;
}