'use strict';

const dateStr = d => d.toISOString().split('T')[0];

const date = d => dateStr(d).split('-');

const getCalendar = (m = 0) => {
	const today = new Date();
	const [year, mo, day] = date(today);
	const month =
		typeof m === 'string' ? m : String(Number(mo) + m).padStart(2, '0');
	const days = [];
	for (let i = 1; i <= 31; i++) {
		const dom = String(i).padStart(2, '0');
		const ymd = `${year}-${month}-${dom}`;
		const d = new Date(ymd);
		if (d.getMonth() + 1 !== Number(month)) {
			break;
		}
		days.push({ dom: Number(dom), dow: d.getDay(), date: d, ymd });
	}
	const calendar = [];
	let row = 0;
	let i = 0;
	for (let i = days[0].dow; i > 0; i--) {
		days.unshift(null);
	}
	for (const day of days) {
		calendar[row] = calendar[row] || [];
		calendar[row].push(
			day
				? {
						dow: daysOfWeek[day.dow],
						dom: String(day.dom).padStart(2, '0'),
						date: day.date
				  }
				: undefined
		);
		if (i > 5) {
			row++;
			i = 0;
			continue;
		}
		i++;
	}
	while (calendar[calendar.length - 1].length < 7) {
		calendar[calendar.length - 1].push(undefined);
	}
	return calendar;
};

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthsOfYear = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];

const TimetableTypes = {
	Shift: 'shift',
	Holiday: 'holiday'
};

const getMonth = (m = 0) => {
	const [year, month, day] = date(new Date());
	return monthsOfYear[Number(month) - 1 + m];
};

const calhead = month => {
	const thead = document.createElement('thead');
	const name = document.createElement('tr');
	const namedata = document.createElement('th');
	namedata.setAttribute('colspan', '7');
	namedata.style.textAlign = 'center';
	namedata.textContent = month;
	name.appendChild(namedata);
	thead.appendChild(name);
	const tr = document.createElement('tr');
	for (let i = 0; i < 7; i++) {
		const th = document.createElement('th');
		th.textContent = daysOfWeek[i];
		tr.appendChild(th);
	}
	thead.appendChild(tr);
	return thead;
};

const dates = {};

const calendarTable = (month, calendar) => {
	const table = document.createElement('table');
	table.classList.add('table', 'table-sm', 'table-hover', 'table-bordered');
	table.appendChild(calhead(month));
	const tbody = document.createElement('tbody');
	for (const row of calendar) {
		const tr = document.createElement('tr');
		tr.addEventListener('click', e => {
			document.querySelectorAll('.timetable').forEach(el => {
				const week = row.filter(x => x);
				timetable(week, el);
			});
		});
		for (const day of row) {
			const td = document.createElement('td');
			if (day) {
				td.textContent = day.dom;
				dates[dateStr(day.date)] = td;
				td.addEventListener('click', async e => {
					const res = await fetch('/save/holidays', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify(
							td.classList.contains('green')
								? {
										set: [],
										unset: [dateStr(day.date)]
								  }
								: {
										set: [dateStr(day.date)],
										unset: []
								  }
						)
					});
					const text = await res.text();
					if (res.status !== 200) {
						alert(text);
						return;
					}
					td.classList.toggle('green');
				});
			}
			tr.appendChild(td);
		}
		tbody.appendChild(tr);
	}
	table.appendChild(tbody);
	return table;
};

const fillShifts = async id => {
	const res = await fetch('/save/getShifts', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ id })
	});
	if (res.status !== 200) {
		alert(await res.text());
	}
	const data = await res.json();
	data.forEach(shift => {
		const timetable = document.querySelector('.timetable tbody');
		const hours = shift.hours.split(',');
		hours
			.filter(x => x.length > 0)
			.forEach(hour => {
				const row = timetable.children[Number(shift.dayOfWeek)];
				const col = row.children[Number(hour) + 1];
				col.classList.add('red');
				const i = Number(shift.dayOfWeek);
				if (i === -1) {
					return;
				}
				shifts[i] = [...row.children]
					.slice(1)
					.map((x, i) => (x.classList.contains('red') ? i : false))
					.filter(x => x !== false);
			});
	});
};

const fillCalendar = async dates => {
	const res = await fetch('/save/getHolidays', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(Object.keys(dates))
	});
	if (res.status !== 200) {
		alert(await res.text());
	}
	const data = await res.json();
	for (const date of data) {
		if (date in dates) {
			dates[date].classList.add('green');
		}
	}
};

const div = el => {
	const div = document.createElement('div');
	div.classList.add('md-4');
	div.appendChild(el);
	return div;
};

const container = rows => {
	const div = document.createElement('div');
	div.classList.add('container');
	for (const els of rows) {
		div.appendChild(row(els));
	}
	return div;
};

let shifts = [[], [], [], [], [], [], []];

const timetable = (type, week, el) => {
	if (el) {
		el.innerHTML = '';
	}
	const table = el || document.createElement('table');
	table.classList.add(
		'table',
		'table-sm',
		'table-hover',
		'table-bordered',
		'timetable'
	);
	const thead = document.createElement('thead');
	const thr = document.createElement('tr');
	const hash = document.createElement('td');
	hash.textContent = '#';
	thr.appendChild(hash);
	thead.appendChild(thr);
	table.appendChild(thead);
	const tbody = document.createElement('tbody');
	for (let i = 0; i < 24; i++) {
		const th = document.createElement('th');
		th.textContent = String(i).padStart(2, '0');
		thr.appendChild(th);
	}
	for (const day of week) {
		const tr = document.createElement('tr');
		const dd = document.createElement('td');
		dd.textContent = day.dow;
		tr.appendChild(dd);
		for (let i = 0; i < 24; i++) {
			const td = document.createElement('td');
			if (type === TimetableTypes.Shift) {
				td.addEventListener('click', e => {
					td.classList.toggle('red');
					const i = daysOfWeek.findIndex(x => x === day.dow);
					if (i === -1) {
						return;
					}
					shifts[i] = [...tr.children]
						.slice(1)
						.map((x, i) =>
							x.classList.contains('red') ? i : false
						)
						.filter(x => x !== false);
				});
			} else if (type === TimetableTypes.Holiday) {
			}
			tr.appendChild(td);
		}
		tbody.appendChild(tr);
	}
	table.appendChild(tbody);
	return table;
};

const row = els => {
	const row = document.createElement('div');
	row.classList.add('row');
	for (const el of els) {
		row.appendChild(el);
	}
	return row;
};
