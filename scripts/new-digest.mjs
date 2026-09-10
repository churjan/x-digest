import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CATEGORIES = ['AI', '产品', '增长', 'UI', '前端', '后端'];
const DATE_ID = /^\d{4}-\d{2}-\d{2}$/;

function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function template(date) {
  const sections = CATEGORIES.map(
    (name) => `## ${name}\n\n1. **标题** — 一句话摘要。[原文](https://x.com/)\n`,
  ).join('\n');

  return `---
date: ${date}
lead: 今日导语（一句话概括本期重点）。
---

${sections}`;
}

const date = process.argv[2] ?? todayISO();

if (!DATE_ID.test(date)) {
  console.error('用法: npm run new -- [YYYY-MM-DD]');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'content', 'digests', `${date}.md`);

try {
  await access(file);
  console.error(`已存在: ${file}`);
  process.exit(1);
} catch {
  // create when missing
}

await mkdir(dirname(file), { recursive: true });
await writeFile(file, template(date), 'utf8');
console.log(`已创建 ${file}`);
