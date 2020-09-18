import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Company } from './Company';
import { Roles } from './enums';

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;

	@Column({ unique: true })
	email!: string;

	@Column()
	password!: string;

	@Column()
	role!: Roles.Worker | Roles.Manager;

	@ManyToOne(() => Company)
	company!: Company;
}
