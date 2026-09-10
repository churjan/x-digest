export function readDateRange(search: string, dates: string[]) {
  const params = new URLSearchParams(search);
  const start = params.get('start') || '';
  const end = params.get('end') || '';
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!validDate(start) || !validDate(end) || start > end || !dates.some((date) => date >= start && date <= end)) return null;
  return { start, end };
}

export function rangeQuery(range: { start: string; end: string } | null) {
  return range ? `?${new URLSearchParams(range).toString()}` : '';
}

/** Inclusive calendar-day ranges in the digest's time zone. */
export function recentDateRange(days: number, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)!.value;
  const end = `${part('year')}-${part('month')}-${part('day')}`;
  const first = new Date(end + 'T12:00:00Z');
  first.setUTCDate(first.getUTCDate() - days + 1);
  return { start: first.toISOString().slice(0, 10), end };
}
