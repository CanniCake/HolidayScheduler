import {
	hash as hashPW,
	needsRehash as pwNeedsRehash,
	verify as verifyPW
} from 'argon2';
import { sign as signJWT, verify as verifyJWT } from 'jsonwebtoken';
import type { Repository } from 'typeorm';
import type { User } from '../tables';

export type loginManager = {
	login: (email: string, password: string, ttl?: string) => Promise<string>;
	loggedInAs: (jwt: string) => Promise<User>;
};

export type JWT = {
	id: number;
};

export const LoginManager = (
	secret: string,
	repo: Repository<User>
): loginManager => ({
	login: async (email, password, ttl = '4h') => {
		const user = await repo.findOne({
			select: ['id', 'password'],
			where: { email }
		});
		if (!user) {
			throw new Error('No user with email: ' + email);
		}
		const correctPassword = await verifyPW(user.password, password);
		if (!correctPassword) {
			throw new Error('Incorrect password for user: ' + email);
		}
		if (pwNeedsRehash(user.password)) {
			await repo.update(user.id, {
				password: await hashPW(password)
			});
		}
		const data: JWT = { id: user.id };
		return new Promise((resolve, reject) =>
			signJWT(data, secret, { expiresIn: ttl }, (err, jwt) => {
				if (err) {
					return reject(err);
				}
				if (!jwt) {
					return reject(new Error("Couldn't generate JWT"));
				}
				resolve(jwt);
			})
		);
	},
	loggedInAs: async jwt => {
		const { id } = await new Promise<JWT>((resolve, reject) =>
			verifyJWT(jwt, secret, (err, decoded) => {
				if (err) {
					return reject(err);
				}
				if (!decoded) {
					return reject(new Error('Empty JWT'));
				}
				resolve(decoded as JWT);
			})
		);
		return repo.findOneOrFail(id, { relations: ['company'] });
	}
});
