import type { Repository } from 'typeorm';
import type { Shift, User } from '../tables';
import { Roles } from '../tables/enums';

export type shiftManager = {
	setWorkingHours: (
		user: User,
		dayOfWeek: number,
		hours: number[]
	) => Promise<void>;
	getManagedWorkers: (user: User) => Promise<User[]>;
};

export const ShiftManager = (
	repo: Repository<Shift>,
	userRepo: Repository<User>
): shiftManager => ({
	setWorkingHours: async (user, dayOfWeek, hours) => {
		try {
			await repo.save({ user, dayOfWeek, hours: hours.join(',') });
		} catch {
			await repo.update({ dayOfWeek, user }, { hours: hours.join(',') });
		}
	},
	getManagedWorkers: async user => {
		return userRepo.find({
			where: {
				company: user.company,
				role: Roles.Worker
			}
		});
	}
});
