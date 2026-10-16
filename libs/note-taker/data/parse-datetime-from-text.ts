const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

export function parseDatetimeFromText(text: string): number | null {
  let _matchedDate: Date | undefined;
  const getMatchedDate = () => {
    if (!_matchedDate) _matchedDate = new Date();
    return _matchedDate;
  };

  // Date portion matching
  const matchedMonthDate = text.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w* ([1-3]?[0-9])/i)
  const matchedDateMonth = text.match(/([1-3]?[0-9]) (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i)
  const matchedDateTh = text.match(/[1-3]?(?:1st|2nd|3rd|[4-9]th)/i);
  const matchedDay = text.match(/(mon|tue|wed|thu|fri|sat|sun)/i)

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
    const matchedDayIndex = days.findIndex(v => v === matchedDay[1].toLowerCase())
    const diff = (7 + matchedDayIndex - currentDay) % 7;
    const toIncrement = diff === 0 ? 7 : diff;
    d.setDate(d.getDate() + toIncrement);
  }

  if (_matchedDate) {
    if (_matchedDate.getTime() < Date.now()) _matchedDate.setFullYear(_matchedDate.getFullYear() + 1);
    _matchedDate.setHours(0, 0, 0, 0)
  }

  // Time portion matching
  const matchedTimeWithAmOrPm = text.match(/\b([0-1]?[0-9]+)(:[0-5][0-9])? ?(am|pm)/);
  const matchedRelativeTime = text.match(/\b(\d+) ?(m|min|minutes|h|hrs|hours)/);

  if (matchedTimeWithAmOrPm) {
    const [_fullMatch, hour, minutes, amOrPm] = matchedTimeWithAmOrPm;

    const hourN = Number(hour);
    if (Number.isNaN(hour) || hourN < 1 || hourN > 12) return null;
    
    const calculatedHour = amOrPm === 'am' ? hourN : hourN + 12;
    const calculatedMinutes = minutes ? Number(minutes.slice(1)) : 0;

    getMatchedDate().setHours(calculatedHour, calculatedMinutes, 0, 0);
  } else if (matchedRelativeTime) {
    const [_fullMatch, n, minutesOrHours] = matchedRelativeTime;
    const d = getMatchedDate();
    if (minutesOrHours.startsWith('m')) d.setMinutes(d.getMinutes() + Number(n));
    else d.setHours(d.getHours() + Number(n));
  }

  console.log(_matchedDate)

  return _matchedDate?.getTime() ?? null;
}

// if no matching rule is provided, it should return null
// possible matching rules:
/**
 * 25/10
 */
