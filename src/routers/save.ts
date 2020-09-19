import { json, Router } from 'express';
import { getSessionToken } from '.';
import { holidayManager } from '../logic/holiday';
import { loginManager } from '../logic/login';
import { shiftManager } from '../logic/shift';
import { User } from '../tables';
import { Roles } from '../tables/enums';
import cookieParser = require('cookie-parser');

const isHolidays = (x: unknown): x is { set: string[]; unset: string[] } =>
	x &&
	typeof x === 'object' &&
	'set' in x &&
	Array.isArray((x as { set: unknown[] }).set) &&
	(x as { set: string[] }).set.every(s => typeof s === 'string') &&
	'unset' in x &&
	Array.isArray((x as { unset: unknown[] }).unset) &&
	(x as { unset: string[] }).unset.every(s => typeof s === 'string');

const isShifts = (
	x: unknown
): x is { workers: string[]; shifts: number[][] } => {
	for (const y of (x as { workers: string[] }).workers) {
		if (typeof y !== 'string') {
			return false;
		}
	}
	for (const y of (x as { shifts: number[][] }).shifts) {
		if (!Array.isArray(y)) {
			return false;
		}
		for (const z of y) {
			if (typeof z !== 'number') {
				return false;
			}
		}
	}
	return true;
};

export const save = (
	holiday: holidayManager,
	login: loginManager,
	shift: shiftManager
): Router => {
	const app = Router();

	app.post('/shifts', cookieParser(), json(), async (req, res) => {
		const token = getSessionToken(req);
		if (!token) {
			return res.status(400).json('Not signed in');
		}
		try {
			const user = await login.loggedInAs(token);
			if (!user) {
				return res.status(400).json('Not signed in');
			}
			if (user.role !== Roles.Manager) {
				return res.status(400).json('You are not a manager');
			}
			if (!isShifts(req.body)) {
				return res.status(400).json('Request is not a shifts object');
			}
			const { workers, shifts } = req.body;
			for (let i = 0; i < shifts.length; i++) {
				const x = shifts[i];
				const managedWorkers = (
					await shift.getManagedWorkers(user)
				).filter(worker =>
					workers.some(x => Number(x.split('_')[1]) === worker.id)
				);
				for (const worker of managedWorkers) {
					await shift.setWorkingHours(worker, i, x);
				}
			}
			return res.json('OK');
		} catch (err) {
			return res.status(500).json((err as Error).message);
		}
	});

	app.post('/getShifts', cookieParser(), json(), async (req, res) => {
		const token = getSessionToken(req);
		if (!token) {
			return res.status(400).json('Not signed in');
		}
		try {
			const user = await login.loggedInAs(token);
			if (!user) {
				return res.status(400).json('Not signed in');
			}
			if (user.role !== Roles.Manager) {
				return res.status(400).json('You are not a manager');
			}
			res.json(
				await shift.getWorkingHours(
					user.company,
					Object.keys(req.body).length > 0
						? (req.body as User)
						: undefined
				)
			);
		} catch (err) {
			return res.status(500).json((err as Error).message);
		}
	});

	app.post('/holidays', cookieParser(), json(), async (req, res) => {
		const token = getSessionToken(req);
		if (!token) {
			return res.status(400).json('Not signed in');
		}
		try {
			const user = await login.loggedInAs(token);
			if (!user) {
				return res.status(400).json('Not signed in');
			}
			if (!isHolidays(req.body)) {
				return res.status(400).json('Request is not a holidays object');
			}
			await Promise.all([
				Promise.all(
					req.body.set.map(x => holiday.setHoliday(user, new Date(x)))
				),
				Promise.all(
					req.body.unset.map(x =>
						holiday.unsetHoliday(user, new Date(x))
					)
				)
			]);
			res.send('OK');
		} catch (err) {
			return res.status(500).json((err as Error).message);
		}
	});

	app.post('/getHolidays', cookieParser(), json(), async (req, res) => {
		const token = getSessionToken(req);
		if (!token) {
			return res.status(400).json('Not signed in');
		}
		try {
			const user = await login.loggedInAs(token);
			if (!user) {
				return res.status(400).json('Not signed in');
			}
			if (
				!(
					Array.isArray(req.body) &&
					req.body.every(x => typeof x === 'string')
				)
			) {
				return res
					.status(400)
					.json('Request is not a getHolidays object');
			}
			res.json(await holiday.findHolidays(user, req.body as string[]));
		} catch (err) {
			return res.status(500).json((err as Error).message);
		}
	});

	return app;
};
