import type { Repository } from 'typeorm';
import type { Company, Shift, User } from '../tables';
import { Roles } from '../tables/enums';

export type shiftManager = {
	setWorkingHours: (
		user: User,
		dayOfWeek: number,
		hours: number[]
	) => Promise<void>;
	getWorkingHours: (company: Company, worker?: User) => Promise<Shift[]>;
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
	getWorkingHours: async (company, worker) => {
		console.log(company, worker);
		if (worker) {
			const shifts = await repo.find({ where: { user: worker } });
			return shifts;
		} else {
			const users = await userRepo.find({ where: { company } });
			const shifts = (
				await Promise.all(
					users.map(user => repo.find({ where: { user } }))
				)
			).flat();
			return shifts;
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
