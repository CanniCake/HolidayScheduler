import type { holidayManager } from './holiday';
import type { loginManager } from './login';
import type { shiftManager } from './shift';

export type Logic = {
	holiday: holidayManager;
	login: loginManager;
	shift: shiftManager;
};
