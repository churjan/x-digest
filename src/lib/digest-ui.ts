
import { loadRangeFeed } from './range-feed';
import { createMasonry } from './masonry';
import { readDateRange } from './date-range';
let cleanupMasonry = () => {};
const viewStorageKey = 'x-digest:view-mode';
let currentView: 'masonry' | 'list' = 'masonry';
try {
  if (localStorage.getItem(viewStorageKey) === 'list') currentView = 'list';
} catch {
  // Storage may be unavailable; keep the default and allow in-page switching.
}
export function initDigest() {
  cleanupMasonry();
  const article = document.querySelector<HTMLElement>('.digest');
  if (!article) return;
  const batchSize = 12;
  const dates: string[] = JSON.parse(document.querySelector<HTMLElement>('.calendar-picker')?.dataset.dates || '[]');
  let rangePending = Boolean(readDateRange(location.search, dates));
  let visibleLimit = batchSize;
  let loadingBatch = false;
  let frame = 0;
  const sentinel = document.createElement('div');
  sentinel.className = 'card-load-sentinel';
  const moreButton = document.createElement('button');
  moreButton.type = 'button';
  moreButton.textContent = '加载更多';
  moreButton.setAttribute('aria-label', '加载更多当前筛选下的卡片');
  sentinel.append(moreButton);
  article.querySelector('.digest-body')?.after(sentinel);
  const endMessage = document.createElement('p');
  endMessage.className = 'card-feed-end';
  endMessage.textContent = '已经到底了';
  endMessage.hidden = true;
  endMessage.setAttribute('role', 'status');
  sentinel.after(endMessage);
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) loadNextBatch();
  }, { rootMargin: '0px 0px 300px 0px' });
  const loadNextBatch = () => {
    if (loadingBatch || sentinel.hidden || !article.isConnected) return;
    loadingBatch = true;
    observer.unobserve(sentinel);
    frame = requestAnimationFrame(() => {
      visibleLimit += batchSize;
      applyFilter(activeCategory, false);
      loadingBatch = false;
    });
  };
  moreButton.addEventListener('click', loadNextBatch);
  cleanupMasonry = () => {
    masonry?.destroy();
    observer.disconnect();
    cancelAnimationFrame(frame);
    sentinel.remove();
    endMessage.remove();
  };
  let masonry: ReturnType<typeof createMasonry> | undefined;
  const refreshMasonry = () => {
    masonry?.destroy();
    const grid = article?.querySelector<HTMLElement>('.digest-grid');
    if (article) article.dataset.view = currentView;
    for (const content of grid?.querySelectorAll<HTMLElement>('.card-content') || []) {
      const heading = content.querySelector('h3')!;
      const category = content.querySelector('.card-category')!;
      const meta = content.querySelector('.card-meta')!;
      const actions = content.querySelector('.card-meta-end')!;
      const existing = content.querySelector('.card-list-heading');
      if (currentView === 'list' && !existing) {
        const row = document.createElement('div');
        row.className = 'card-list-heading';
        const group = document.createElement('div');
        group.className = 'card-title-group';
        group.append(heading, category);
        row.append(group, actions);
        content.prepend(row);
      } else if (currentView === 'masonry' && existing) {
        content.prepend(heading);
        meta.append(category, actions);
        existing.remove();
      }
    }
    masonry = grid && currentView === 'masonry' ? createMasonry(grid) : undefined;
    for (const button of article?.querySelectorAll<HTMLButtonElement>('.view-switch button') || []) {
      button.setAttribute('aria-pressed', String(button.dataset.view === currentView));
    }
  };
  for (const button of article?.querySelectorAll<HTMLButtonElement>('.view-switch button') || []) {
    button.addEventListener('click', () => {
      currentView = button.dataset.view === 'list' ? 'list' : 'masonry';
      try { localStorage.setItem(viewStorageKey, currentView); } catch { /* Keep switching usable without storage. */ }
      refreshMasonry();
    });
  }
  const filters = Array.from(document.querySelectorAll<HTMLButtonElement>('.toc button'));
  let cards = Array.from(document.querySelectorAll<HTMLElement>('.digest-card'));
  let activeCategory = '';
  const applyFilter = (category: string, reset = true) => {
    activeCategory = category;
    if (reset) visibleLimit = batchSize;
    let matches = 0;
    for (const card of cards) {
      const included = !category || card.dataset.category === category;
      if (included) matches++;
      card.hidden = !included || matches > visibleLimit;
    }
    for (const button of filters) button.setAttribute('aria-pressed', String(button.dataset.filter === category));
    masonry?.layout();
    sentinel.hidden = matches <= visibleLimit;
    endMessage.hidden = !sentinel.hidden || rangePending || Boolean(article.querySelector('.range-retry:not([hidden])'));
    endMessage.textContent = matches ? '已经到底了' : '暂无相关内容';
    observer.unobserve(sentinel);
    if (!sentinel.hidden) observer.observe(sentinel);
  };
  for (const button of filters) button.addEventListener('click', () => {
    applyFilter(button.dataset.filter || '');
    document.getElementById('digest-top')?.scrollIntoView({ block: 'start' });
  });
  const setupImages = () => {
  for (const image of document.querySelectorAll<HTMLImageElement>('.card-media img')) {
    if (image.dataset.fallbackReady) continue;
    image.dataset.fallbackReady = 'true';
    const fallback = () => {
      image.hidden = true;
      const container = image.closest('.card-image');
      if (container && !container.querySelector('.image-fallback')) {
        const label = document.createElement('span');
        label.className = 'image-fallback';
        label.textContent = '配图暂未加载';
        container.append(label);
      }
    };
    image.addEventListener('error', fallback);
    if (image.complete && !image.naturalWidth) fallback();
  }
  };
  setupImages();
  refreshMasonry();
  applyFilter('');
  void loadRangeFeed(() => {
    if (!article?.isConnected) return;
    rangePending = false;
    cards = Array.from(document.querySelectorAll<HTMLElement>('.digest-card'));
    setupImages();
    refreshMasonry();
    applyFilter(activeCategory);
  });

}
