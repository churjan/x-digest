# X早报

每日精选 X 上的 **AI / 产品 / 增长 / UI / 前端 / 后端** 热帖。首页即最新一期。

- 最新一期：`/`
- 某一期：`/YYYY-MM-DD`

正文用编号列表，不用表格。

## 本地开发

需要 **Node 22+**（仓库里有 `.nvmrc` / `.node-version`）。

```bash
npm install
npm run dev
```

预览生产构建：

```bash
npm run build
npm run preview
```

## 写新的一期

```bash
npm run new
# 或指定日期
npm run new -- 2026-09-11
```

会在 `content/digests/YYYY-MM-DD.md` 生成脚手架。文件已存在则直接退出，不会覆盖。

### 正文格式

```markdown
---
date: 2026-09-10
lead: 今日导语（一句话概括本期重点）。
---

## AI

1. **标题** — 摘要。[原文](https://x.com/)

## 产品

1. **标题** — 摘要。[原文](https://x.com/)
```

栏目请按这个顺序写，缺的栏目可以整节删掉：

1. AI
2. 产品
3. 增长
4. UI
5. 前端
6. 后端

每条用编号列表：加粗标题、一句摘要、指向 X 原文的链接。仓库已带一期样例：`content/digests/2026-09-10.md`。

## 部署到 Cloudflare Pages

这是纯静态站，构建产物在 `dist/`，不需要 Cloudflare adapter。

在 Cloudflare Pages 里连接仓库后填写：

1. 构建命令：`npm run build`
2. 输出目录：`dist`
3. Node.js 版本：`22`

Node 版本也可以靠仓库根目录的 `.nvmrc`（内容为 `22`）识别。自定义域名时，把 `astro.config.mjs` 里的 `site` 改成你的站点 URL，RSS 和 canonical 才会指向正确地址。

## 目录

```
content/digests/     # 每期 Markdown，文件名必须是 YYYY-MM-DD.md
scripts/new-digest.mjs
src/
  content.config.ts  # 内容集合
  components/
  layouts/
  pages/             # /、/YYYY-MM-DD、RSS
  styles/
```
