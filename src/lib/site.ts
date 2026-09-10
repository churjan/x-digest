export const SITE = {
  name: 'X早报',
  description: '每日精选 X 上的 AI、产品、增长、UI、前端、后端热帖。首页即最新一期。',
  tagline: '每日精选热帖',
};

export const DATE_ID = /^\d{4}-\d{2}-\d{2}$/;

export const CATEGORIES = [
  { slug: 'ai', label: 'AI' },
  { slug: 'product', label: '产品' },
  { slug: 'growth', label: '增长' },
  { slug: 'ui', label: 'UI' },
  { slug: 'frontend', label: '前端' },
  { slug: 'backend', label: '后端' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export const CATEGORY_LABELS = CATEGORIES.map((category) => category.label);

export function isCategorySlug(value: string): value is CategorySlug {
  return CATEGORIES.some((category) => category.slug === value);
}

export function categoryBySlug(slug: string) {
  return CATEGORIES.find((category) => category.slug === slug);
}

export function categoryByLabel(label: string) {
  return CATEGORIES.find((category) => category.label === label);
}
