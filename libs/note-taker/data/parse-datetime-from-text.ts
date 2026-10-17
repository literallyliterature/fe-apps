const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export const daysForRegular = [...days, 'daily'] as const;

const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;

export function parseDatetimeFromText(text: string): null | number {
  let _matchedDate: Date | undefined;
  const getMatchedDate = () => {
    if (!_matchedDate) _matchedDate = new Date();
    return _matchedDate;
  };

  // Date portion matching
  const matchedMonthDate = text.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w* ([1-3]?\d)/i);
  const matchedDateMonth = text.match(/([1-3]?\d) (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
  const matchedDateTh = text.match(/[1-3]?(?:1st|2nd|3rd|[4-9]th)/i);
  const matchedDay = getMatchedDay(text);

  if (matchedMonthDate) {
    const monthIndex = months.findIndex(m => m === matchedMonthDate[1].toLowerCase());
    const date = Number(matchedMonthDate[2]);
    getMatchedDate().setMonth(monthIndex, date);
  } else if (matchedDateMonth) {
    const monthIndex = months.findIndex(m => m === matchedDateMonth[2].toLowerCase());
    const date = Number(matchedDateMonth[1]);
    getMatchedDate().setMonth(monthIndex, date);
  } else if (matchedDateTh) {
    const n = Number(matchedDateTh[0].slice(0, -2));
    if (Number.isNaN(n)) return null;
    const d = getMatchedDate();
    d.setDate(n);
  } else if (matchedDay) {
    const d = getMatchedDate();
    // sun is 0
    const currentDay = d.getDay();
    const matchedDayIndex = (matchedDay === 'tomorrow' || matchedDay === 'daily')
      ? (currentDay + 1)
      : days.findIndex(v => v === matchedDay);
    const diff = (7 + matchedDayIndex - currentDay) % 7;
    const toIncrement = diff === 0 ? 7 : diff;
    d.setDate(d.getDate() + toIncrement);
  }

  if (_matchedDate) {
    if (_matchedDate.getTime() < Date.now()) _matchedDate.setFullYear(_matchedDate.getFullYear() + 1);
    _matchedDate.setHours(0, 0, 0, 0);
  }

  // Time portion matching
  const matchedHoursAndMinutes = getMatchedHoursAndMinutes(text);
  const matchedRelativeTime = text.match(/\b(\d+) ?(m|h)/);

  if (matchedHoursAndMinutes) {
    const { hours, minutes } = matchedHoursAndMinutes;
    getMatchedDate().setHours(hours, minutes, 0, 0);
  } else if (matchedRelativeTime) {
    const [_fullMatch, n, minutesOrHours] = matchedRelativeTime;
    const d = getMatchedDate();
    if (minutesOrHours.startsWith('m')) d.setMinutes(d.getMinutes() + Number(n));
    else d.setHours(d.getHours() + Number(n));
  }

  return _matchedDate?.getTime() ?? null;
}

const dayMatches = [...days, 'tomorrow', 'daily'] as const;
export function convertHoursAndMinutesToWrittenTime({ hours, minutes }: { hours: number; minutes: number }): string {
  const m = getMinutesWith2Digits(minutes);
  if (hours === 0) return `12:${m}am`;
  if (hours < 12) return `${hours}:${m}am`;
  if (hours === 12) return `${hours}:${m}pm`;
  return `${hours - 12}:${m}pm`;
}

export function getMatchedDay(text: string): (typeof dayMatches)[number] | undefined {
  const lowercase = text.toLowerCase();
  const foundText = dayMatches.find(d => lowercase.includes(d));
  return foundText;
}

export function getMatchedHoursAndMinutes(text: string): undefined | { hours: number; minutes: number } {
  // Time portion matching
  const matchedTimeWithAmOrPm = text.match(/\b(\d+)(:[0-5]\d)? ?(am|pm)/);

  if (matchedTimeWithAmOrPm) {
    const [_fullMatch, hour, minutes, amOrPm] = matchedTimeWithAmOrPm;

    const hourN = Number(hour);
    if (Number.isNaN(hour) || hourN < 1 || hourN > 12) return undefined;

    const calculatedHour = amOrPm === 'am' ? hourN : hourN + 12;
    const calculatedMinutes = minutes ? Number(minutes.slice(1)) : 0;

    return { hours: calculatedHour, minutes: calculatedMinutes };
  }

  return undefined;
}

export function getMinutesWith2Digits(minutes: number) {
  const s = String(minutes);
  return s.length === 1 ? `0${s}` : s;
}
