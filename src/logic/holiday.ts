import { Repository } from 'typeorm';
import type { User } from '../tables';
import type { Holiday } from '../tables/Holiday';

export type holidayManager = {
	setHoliday: (user: User, date: Date) => Promise<Holiday>;
	unsetHoliday: (user: User, date: Date) => Promise<void>;
	findHolidays: (user: User, dates: string[]) => Promise<string[]>;
};

export const HolidayManager = (
	repo: Repository<Holiday>,
	userRepo: Repository<User>
): holidayManager => ({
	setHoliday: async (user, date) => {
		const coworkers = (
			await userRepo.find({
				where: { company: user.company },
				relations: ['company']
			})
		).filter(x => x.id !== user.id);
		const coworkerHolidays = await Promise.all(
			coworkers.map(worker =>
				repo.findOne({
					user: worker,
					date: date.toISOString().split('T')[0]
				})
			)
		);
		console.log(coworkers, coworkerHolidays);
		if (coworkerHolidays.every(x => x !== undefined)) {
			// if all coworkers have holiday that day, fail
			throw new Error(
				'No coworkers are working on ' +
					date.toISOString().split('T')[0]
			);
		}
		return repo.save({ user, date });
	},
	unsetHoliday: async (user, date) => {
		await repo.delete({ user, date: date.toISOString().split('T')[0] });
	},
	findHolidays: async (user, dates) => {
		const results = await dates
			.slice(1)
			.reduce(
				(q, date, i, arr) =>
					q.orWhere(
						'holiday.date = :date' +
							String(i) +
							(i + 1 === arr.length ? ')' : ''),
						{
							['date' + String(i)]: date
						}
					),
				repo
					.createQueryBuilder('holiday')
					.where('holiday.userId = :id', { id: user.id })
					.andWhere('(holiday.date = :date', { date: dates[0] })
			)
			.getMany();
		return results
			.flat(1)
			.map(x => new Date(x.date).toISOString().split('T')[0]);
	}
});
