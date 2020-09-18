import {
	Column,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
	Unique
} from 'typeorm';
import { User } from './User';

@Unique(['user', 'date'])
@Entity()
export class Holiday {
	@PrimaryGeneratedColumn()
	id!: number;

	@ManyToOne(() => User)
	user!: User;

	@Column({ type: 'date' })
	date!: Date;
}
