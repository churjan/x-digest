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
