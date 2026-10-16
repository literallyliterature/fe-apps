import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,

} from 'vitest';

import { parseDatetimeFromText } from './parse-datetime-from-text';

describe('parseDatetimeFromText', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const date = new Date('2026-10-16T11:23:45');
    vi.setSystemTime(date);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it.for([
    'asdf',
  ])('returns null', (v) => {
    expect(parseDatetimeFromText(v)).toBe(null);
  });

  it.for([
    // relative time
    ['10m', '2026-10-16T11:33:45'],
    ['10min', '2026-10-16T11:33:45'],
    ['10 minutes', '2026-10-16T11:33:45'],
    ['10h', '2026-10-16T21:23:45'],
    ['10hrs', '2026-10-16T21:23:45'],
    ['10 hours', '2026-10-16T21:23:45'],

    // exact time
    ['3pm', '2026-10-16T15:00:00'],
    ['3:30 pm', '2026-10-16T15:30:00'],

    // day
    ['mon', '2026-10-19T00:00:00'],
    ['Tuesday', '2026-10-20T00:00:00'],

    // date
    ['22nd', '2026-10-22T00:00:00'],
    ['23 oct', '2026-10-23T00:00:00'],
    ['Nov 13th', '2026-11-13T00:00:00'],
    ['dec 15', '2026-12-15T00:00:00'],
  ] satisfies Array<[string, string]>)('returns correct time for %s', ([inputText, result]) => {
    expect(parseDatetimeFromText(inputText)).toEqual(new Date(result).getTime());
  });

  it('calculates next week if given current day', () => {
    // 2026-10-16 is a fri
    expect(parseDatetimeFromText('fri')).toEqual(new Date('2026-10-23T00:00:00').getTime());
    expect(parseDatetimeFromText('sat')).toEqual(new Date('2026-10-17T00:00:00').getTime());
  });

  it('correctly calculates relative date in the next month', () => {
    const oct29 = new Date('2026-10-29T11:23:45');
    vi.setSystemTime(oct29);

    expect(parseDatetimeFromText('mon')).toEqual(new Date('2026-11-02T00:00:00').getTime());
  });

  it('correctly calculates dates for next year', () => {
    expect(parseDatetimeFromText('jan 2')).toEqual(new Date('2027-01-02T00:00:00').getTime());
  });
});
