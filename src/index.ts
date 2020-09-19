import { ok } from 'assert';
import { HolidayManager } from './logic/holiday';
import { LoginManager } from './logic/login';
import { ShiftManager } from './logic/shift';
import { serve } from './routers';
import { load } from './tables';

ok(process.env.JWT_SECRET, 'Missing JWT_SECRET!');

const jwtSecret = process.env.JWT_SECRET;

void (async () => {
	const repos = await load({
		type: 'sqlite',
		database: 'holiday.db',
		synchronize: true,
		logging: true
	});
	serve(
		{
			holiday: HolidayManager(repos.Holiday, repos.User),
			login: LoginManager(jwtSecret, repos.User),
			shift: ShiftManager(repos.Shift, repos.User)
		},
		{ port: 3000, host: '0.0.0.0', log: console.log }
	);
})();
