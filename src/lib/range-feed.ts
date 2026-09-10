import { readDateRange } from './date-range';
import { shortDateId } from './dates';

/** Reuse the static daily pages so a range fetches only its own issues. */
export async function loadRangeFeed(onChange: () => void) {
  const picker = document.querySelector<HTMLElement>('.calendar-picker');
  const dates: string[] = JSON.parse(picker?.dataset.dates || '[]');
  const range = readDateRange(location.search, dates);
  if (!range) return;
  const chosen = dates.filter((date) => date >= range.start && date <= range.end);
  const body = document.querySelector<HTMLElement>('.digest-body')!;
  const header = document.querySelector<HTMLElement>('.digest-head')!;
  header.querySelector('.kicker')?.remove();
  header.querySelector('.digest-summary')?.remove();
  header.querySelector('h1')!.textContent = `${shortDateId(range.start)} — ${shortDateId(range.end)}`;
  document.title = `${range.start} 至 ${range.end} · X早报`;
  const message = document.createElement('p');
  message.className = 'range-feed-status';
  message.setAttribute('role', 'status');
  message.textContent = '正在加载所选日期范围的早报…';
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = '重试未加载的早报';
  retry.className = 'range-retry';
  retry.hidden = true;
  const grid = document.createElement('div');
  grid.className = 'digest-grid';
  body.replaceChildren(message, retry, grid);
  const results = new Map<string, HTMLElement[]>();
  let loading = false;
  const fetchMissing = async () => {
    if (loading) return;
    loading = true;
    retry.hidden = true;
    message.textContent = '正在加载所选日期范围的早报…';
    const queue = chosen.filter((date) => !results.has(date));
    // Bound simultaneous requests and keep the final feed in date order.
    await Promise.all(Array.from({ length: Math.min(3, queue.length) }, async () => {
      while (queue.length) {
        const date = queue.shift()!;
        try {
          const response = await fetch(`/${date}`, { signal: AbortSignal.timeout(20000) });
          if (!response.ok) throw new Error(String(response.status));
          const page = new DOMParser().parseFromString(await response.text(), 'text/html');
          if (!page.querySelector('.digest-body')) throw new Error('Missing digest');
          const cards = Array.from(page.querySelectorAll<HTMLElement>('.digest-card'));
          for (const card of cards) {
            card.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
            card.dataset.date = date;
            const time = document.createElement('time');
            time.className = 'card-issue-date';
            time.dateTime = date;
            time.textContent = shortDateId(date).replace(/^\d+年/, '');
            time.setAttribute('aria-label', shortDateId(date));
            card.querySelector('.card-meta-end')?.prepend(time);
          }
          results.set(date, cards);
        } catch {
          // Keep successful issues and offer an explicit retry for failures.
        }
      }
    }));
    grid.replaceChildren(...chosen.flatMap((date) => results.get(date) || []));
    const failed = chosen.filter((date) => !results.has(date));
    message.textContent = failed.length ? `以下日期加载失败：${failed.join('、')}` : '';
    retry.hidden = !failed.length;
    loading = false;
    onChange();
  };
  retry.addEventListener('click', fetchMissing);
  await fetchMissing();
}
