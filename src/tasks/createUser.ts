import { hash } from 'argon2';
import { load } from '../tables';
import { Roles } from '../tables/enums';

void (async () => {
	const repos = await load({
		type: 'sqlite',
		database: 'holiday.db',
		synchronize: true,
		logging: true
	});
	const company = await repos.Company.save({
		name: 'TestCorp'
	});
	await repos.User.save({
		name: 'Manager',
		email: 'manager@test.com',
		password: await hash('test'),
		role: Roles.Manager,
		company
	});
	await repos.User.save({
		name: 'Worker 1',
		email: 'work1@test.com',
		password: await hash('test'),
		role: Roles.Worker,
		company
	});
	await repos.User.save({
		name: 'Worker 2',
		email: 'work2@test.com',
		password: await hash('test'),
		role: Roles.Worker,
		company
	});
})();
