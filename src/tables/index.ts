import { ConnectionOptions, createConnection, Repository } from 'typeorm';
import { Company } from './Company';
import { Holiday } from './Holiday';
import { Shift } from './Shift';
import { User } from './User';

export { Company, Shift, User };

export type Repos = {
	Company: Repository<Company>;
	Holiday: Repository<Holiday>;
	Shift: Repository<Shift>;
	User: Repository<User>;
};

export const load = async (opts: ConnectionOptions): Promise<Repos> => {
	const conn = await createConnection({
		...opts,
		entities: [Company, Holiday, Shift, User]
	});
	return {
		Company: conn.getRepository(Company),
		Holiday: conn.getRepository(Holiday),
		Shift: conn.getRepository(Shift),
		User: conn.getRepository(User)
	};
};
