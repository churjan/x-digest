/** Lay cards into the shortest column while retaining their DOM reading order. */
export function createMasonry(grid: HTMLElement) {
  let frame = 0;
  let width = -1;
  let destroyed = false;
  const layout = () => {
    if (destroyed || !grid.isConnected) return;
    const style = getComputedStyle(grid);
    const count = Number(style.getPropertyValue('--card-columns')) || 3;
    const gap = parseFloat(style.columnGap) || 0;
    width = grid.clientWidth;
    if (!width) return;
    const cardWidth = (width - gap * (count - 1)) / count;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>('.digest-card:not([hidden])'));
    grid.dataset.masonry = 'true';
    for (const card of cards) card.style.width = `${cardWidth}px`;
    const heights = Array(count).fill(0);
    // Read heights after applying all widths to avoid repeated layout work.
    const sizes = cards.map((card) => card.offsetHeight);
    cards.forEach((card, index) => {
      const column = heights.indexOf(Math.min(...heights));
      card.style.left = `${column * (cardWidth + gap)}px`;
      card.style.top = `${heights[column]}px`;
      heights[column] += sizes[index] + gap;
    });
    grid.style.height = `${Math.max(0, ...heights) ? Math.max(...heights) - gap : 0}px`;
  };
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(layout);
  };
  const observer = new ResizeObserver((entries) => {
    if (entries.some((entry) => entry.target !== grid || grid.clientWidth !== width)) schedule();
  });
  observer.observe(grid);
  grid.querySelectorAll('.digest-card').forEach((card) => observer.observe(card));
  // A breakpoint may change the column count without changing container width.
  window.addEventListener('resize', schedule);
  layout();
  return {
    layout,
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      delete grid.dataset.masonry;
      grid.style.removeProperty('height');
      grid.querySelectorAll<HTMLElement>('.digest-card').forEach((card) => {
        for (const property of ['width', 'left', 'top']) card.style.removeProperty(property);
      });
    },
  };
}
