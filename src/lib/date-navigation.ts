import { initDigest } from './digest-ui';

/** Keep the sidebar mounted when navigating between individual issues. */
export function setupDateNavigation() {
  let controller: AbortController | undefined;
  const column = document.querySelector<HTMLElement>('.reading-column');
  if (!column) return;
  const status = document.createElement('div');
  status.className = 'date-navigation-status';
  status.setAttribute('role', 'status');
  column.before(status);
  const skeleton = document.createElement('div');
  skeleton.className = 'digest-skeleton';
  skeleton.setAttribute('aria-hidden', 'true');
  skeleton.innerHTML = '<div class="skeleton-title"></div><div class="skeleton-summary"></div><div class="skeleton-cards">' +
    '<div><div class="skeleton-image"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>'.repeat(3) + '</div>';
  const clearLoading = () => {
    column.classList.remove('is-loading');
    column.removeAttribute('aria-busy');
    column.removeAttribute('inert');
    skeleton.remove();
  };
  const navigate = async (url: URL, push = true) => {
    controller?.abort();
    const request = new AbortController();
    controller = request;
    clearLoading();
    status.replaceChildren();
    column.setAttribute('aria-busy', 'true');
    column.setAttribute('inert', '');
    // Avoid a brief skeleton flash for requests that complete immediately.
    const delay = window.setTimeout(() => {
      column.append(skeleton);
      column.classList.add('is-loading');
    }, 300);
    try {
      const response = await fetch(url, { signal: AbortSignal.any([request.signal, AbortSignal.timeout(15000)]) });
      if (!response.ok) throw new Error('Failed to load issue');
      const html = await response.text();
      if (request.signal.aborted) return;
      const page = new DOMParser().parseFromString(html, 'text/html');
      const incoming = page.querySelector('.reading-column');
      const selected = page.querySelector<HTMLElement>('.calendar-picker')?.dataset.selected;
      if (!incoming?.querySelector('.digest-card') || !selected) throw new Error('Missing issue content');
      incoming.querySelectorAll('script').forEach((script) => script.remove());
      if (push) history.pushState(null, '', url);
      column.replaceChildren(...incoming.childNodes);
      document.title = page.title;
      for (const selector of ['link[rel="canonical"]', 'meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:url"]']) {
        const target = document.querySelector(selector);
        const source = page.querySelector(selector);
        if (target && source) {
          const attribute = target.tagName === 'LINK' ? 'href' : 'content';
          target.setAttribute(attribute, source.getAttribute(attribute) || '');
        }
      }
      for (const link of document.querySelectorAll<HTMLAnchorElement>('.date-list a')) {
        if (new URL(link.href).pathname.replaceAll('/', '') === selected) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      }
      document.dispatchEvent(new CustomEvent('digest:date-change', { detail: selected }));
      initDigest();
      status.textContent = '';
      if (column.getBoundingClientRect().top < 0) window.scrollTo({ top: 0, behavior: 'instant' });
    } catch {
      if (request.signal.aborted) return;
      status.textContent = '加载失败，当前内容已保留。';
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = '重试';
      retry.addEventListener('click', () => void navigate(url, push));
      status.append(retry);
    } finally {
      clearTimeout(delay);
      if (controller === request) clearLoading();
    }
  };
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('.date-list a');
    if (!link || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || !/^\/\d{4}-\d{2}-\d{2}\/?$/.test(url.pathname)) return;
    event.preventDefault();
    void navigate(url);
  });
  window.addEventListener('popstate', () => {
    const url = new URL(location.href);
    // Range URLs retain their existing loading flow.
    if (url.search || !/^\/(?:\d{4}-\d{2}-\d{2}\/?)?$/.test(url.pathname)) location.reload();
    else void navigate(url, false);
  });
}
