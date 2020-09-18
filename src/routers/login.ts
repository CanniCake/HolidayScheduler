import { Router, urlencoded } from 'express';
import { loginManager } from '../logic/login';
import ms = require('ms');

function parseCredentials(
	body: Record<string, unknown>
): asserts body is { email: string; password: string; remember?: string } {
	if (!('email' in body)) {
		throw new Error('Missing email');
	}
	if (!('password' in body)) {
		throw new Error('Missing password');
	}
	if (typeof body.email !== 'string') {
		throw new Error('Wrong type for email');
	}
	if (typeof body.password !== 'string') {
		throw new Error('Wrong type for password');
	}
}

export const login = (login: loginManager): Router => {
	const app = Router();

	app.get('/', (req, res) => {
		res.render('login', {
			pretty: true
		});
	});
	app.post('/', urlencoded({ extended: false }), async (req, res) => {
		try {
			parseCredentials(req.body);
		} catch (err) {
			return res.status(400).render('error', {
				pretty: true,
				message: (err as Error).message
			});
		}
		const { email, password, remember } = req.body;
		try {
			const ttl = remember ? '7d' : '4h';
			const jwt = await login.login(email, password, ttl);
			const expiryDate = new Date(Date.now() + ms(ttl));
			return res
				.cookie('session', jwt, remember ? { expires: expiryDate } : {})
				.redirect('/');
		} catch (err) {
			return res.status(400).render('error', {
				pretty: true,
				message: (err as Error).message
			});
		}
	});
	return app;
};
