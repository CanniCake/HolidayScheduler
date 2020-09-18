import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Company {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ unique: true })
	name!: string;
}
