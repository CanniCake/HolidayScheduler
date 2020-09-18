import {
	Column,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
	Unique
} from 'typeorm';
import { DaysOfWeek } from './enums';
import { User } from './User';

@Unique(['dayOfWeek', 'user'])
@Entity()
export class Shift {
	@PrimaryGeneratedColumn()
	id!: number;

	@ManyToOne(() => User)
	user!: User;

	@Column({ enum: DaysOfWeek })
	dayOfWeek!: DaysOfWeek;

	@Column()
	hours!: string;
}
