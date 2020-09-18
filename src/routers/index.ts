import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import type { Express } from 'express-serve-static-core';
import { join } from 'path';
import { Logic } from '../logic';
import { Roles } from '../tables/enums';
import { login } from './login';
import { save } from './save';

type ServerOptions = {
	port?: number;
	host?: string;
	log?: (...args: unknown[]) => void;
};

export const getSessionToken = (req: express.Request): string | null => {
	if (!req.cookies) {
		return null;
	}
	if (!('session' in req.cookies)) {
		return null;
	}
	if (typeof (req.cookies as { session: unknown }).session !== 'string') {
		return null;
	}
	return (req.cookies as { session: string }).session;
};

export const serve = (
	logic: Logic,
	{ port = 3000, host = '0.0.0.0', log = console.log }: ServerOptions = {}
): Express => {
	const app = express();

	app.set('view engine', 'pug');
	app.set('views', join(__dirname, '..', '..', 'views'));

	app.use('/login', login(logic.login));
	app.use('/save', save(logic.holiday, logic.login, logic.shift));
	app.use('/logout', (req, res) => {
		res.clearCookie('session').redirect('/');
	});

	app.use('/', express.static(join(__dirname, '..', '..', 'public')));
	app.use(
		'/',
		express.static(
			join(__dirname, '..', '..', 'node_modules', 'bootstrap', 'dist')
		)
	);
	app.use(
		'/js',
		express.static(
			join(__dirname, '..', '..', 'node_modules', 'jquery', 'dist')
		)
	);

	app.get('/', cookieParser(), async (req, res) => {
		const token = getSessionToken(req);
		try {
			const user = token ? await logic.login.loggedInAs(token) : null;
			const workers = user
				? await logic.shift.getManagedWorkers(user)
				: null;
			res.render('index', {
				pretty: true,
				roles: Roles,
				user,
				workers
			});
		} catch (err) {
			res.render('error', {
				pretty: true,
				message: (err as Error).message
			});
		}
	});

	app.listen(port, host, () =>
		log('listening on ' + host + ':' + String(port))
	);

	return app;
};
