const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const;

/** Format a YYYY-MM-DD id in Chinese, using UTC so builds don't shift the calendar day. */
export function formatDateId(id: string): string {
  const [year, month, day] = id.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return `${year}年${month}月${day}日 星期${WEEKDAYS[date.getUTCDay()]}`;
}

export function shortDateId(id: string): string {
  const [year, month, day] = id.split('-').map(Number);
  return `${year}年${month}月${day}日`;
}

export function formatMonthHeading(id: string): string {
  const [year, month] = id.split('-').map(Number);
  return `${year}年${month}月`;
}

export function railDate(id: string): { day: string; weekday: string } {
  const [year, month, day] = id.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return {
    day: `${month}月${day}日`,
    weekday: `周${WEEKDAYS[date.getUTCDay()]}`,
  };
}

export function groupDateIdsByMonth(ids: string[]): { key: string; label: string; ids: string[] }[] {
  const groups: { key: string; label: string; ids: string[] }[] = [];
  for (const id of ids) {
    const key = id.slice(0, 7);
    const last = groups.at(-1);
    if (last?.key === key) {
      last.ids.push(id);
    } else {
      groups.push({ key, label: formatMonthHeading(id), ids: [id] });
    }
  }
  return groups;
}
