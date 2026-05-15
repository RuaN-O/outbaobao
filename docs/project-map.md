# 项目地图

本文档用于后续升级、排错、交接时快速理解当前项目结构。

## 1. 项目定位

- 项目类型：单管理员、公开只读的在线公告板
- 前台：公开浏览文章、搜索、标签筛选、单篇详情、二维码分享
- 后台：密码登录、文章新建/编辑、定时发布、富文本写作、图片上传、分享卡片字段维护
- 存储方式：`SQLite + 本地 uploads 目录`

## 2. 技术栈

- Web 框架：`Next.js 15`（App Router）
- 前端：`React 19`
- 数据库访问：`Prisma`
- 数据库：`SQLite`
- 测试：
  - 单元测试：`Vitest`
  - 端到端测试：`Playwright`
- 二维码：`qrcode`

## 3. 根目录结构

```text
E:\OutBaoBao
├─ src/                  核心业务代码
├─ prisma/               Prisma schema 与本地数据库文件
├─ public/               静态资源与上传图片
├─ tests/                单元测试与 E2E 测试
├─ docs/                 设计文档、计划文档、项目地图
├─ middleware.ts         后台与后台 API 的访问保护
├─ package.json          脚本与依赖
├─ next.config.ts        Next 配置
├─ playwright.config.ts  E2E 配置
├─ vitest.config.ts      单测配置
└─ .env.example          环境变量示例
```

## 4. `src` 目录地图

### 4.1 `src/app`

这是 Next.js App Router 入口，负责页面和 API 路由。

#### 页面路由

- `src/app/page.tsx`
  - 公开首页
  - 负责搜索、标签筛选、分页
  - 调用 `listPublicArticles()` 和 `listPublicTags()`

- `src/app/articles/[slug]/page.tsx`
  - 公开文章详情页
  - 调用 `getPublicArticleBySlug()`
  - 负责生成页面 metadata
  - 接入文章二维码分享按钮

- `src/app/admin/login/page.tsx`
  - 后台登录页
  - 表单直接提交到 `/api/admin/login`

- `src/app/admin/page.tsx`
  - 后台首页
  - 展示文章列表

- `src/app/admin/articles/new/page.tsx`
  - 新建文章页

- `src/app/admin/articles/[id]/edit/page.tsx`
  - 编辑文章页

#### API 路由

- `src/app/api/admin/login/route.ts`
  - 校验管理员密码
  - 写入后台 session cookie

- `src/app/api/admin/logout/route.ts`
  - 清理后台登录态

- `src/app/api/admin/articles/route.ts`
  - `GET`：获取后台文章列表
  - `POST`：创建文章

- `src/app/api/admin/articles/[id]/route.ts`
  - `PATCH`：更新文章

- `src/app/api/admin/uploads/route.ts`
  - 上传图片
  - 返回相对路径，例如 `/uploads/xxx.png`

- `src/app/api/qr/route.ts`
  - 根据 `url` 查询参数生成二维码 SVG
  - 给文章详情页的分享弹层使用

#### 全局样式

- `src/app/globals.css`
  - 当前整个项目的主要样式文件
  - 包含公开页、后台页、富文本编辑器、分享弹层样式

### 4.2 `src/components`

#### `src/components/public`

- `article-card.tsx`
  - 首页文章卡片

- `article-search-form.tsx`
  - 公开首页搜索框

- `pagination.tsx`
  - 分页组件

- `tag-filter.tsx`
  - 标签筛选

- `article-share-button.tsx`
  - 文章详情页分享按钮
  - 打开二维码弹层
  - 使用 `/api/qr?url=...` 生成二维码图片

#### `src/components/admin`

- `admin-shell.tsx`
  - 后台页面统一外壳

- `article-list.tsx`
  - 后台文章列表

- `article-form.tsx`
  - 新建/编辑文章共用表单
  - 负责：
    - 标题、摘要、标签
    - 分享标题、分享摘要、分享封面图
    - 发布状态与定时发布时间
    - 调用创建/更新 API

- `rich-text-editor.tsx`
  - 轻量富文本编辑器
  - 当前支持：
    - 段落
    - 小标题
    - 加粗
    - 引用
    - 列表
    - 分隔线
    - 正文图片上传与删除

### 4.3 `src/lib`

这是业务逻辑层，维护时优先看这里。

- `admin-articles.ts`
  - 后台文章仓储层
  - 负责文章 CRUD、标签替换、默认种子数据、slug 生成
  - 是文章持久化的核心文件

- `articles.ts`
  - 公开侧文章查询层
  - 负责公开文章过滤、排序、分页、标签汇总、发布时间判断

- `auth.ts`
  - 管理员密码校验
  - session 签名与解析

- `session.ts`
  - session cookie 名称与类型定义

- `db.ts`
  - Prisma Client 单例

- `env.ts`
  - 环境变量读取入口
  - 当前关键变量：
    - `ADMIN_PASSWORD`
    - `SESSION_SECRET`
    - `SITE_URL`
    - `DATABASE_URL`

- `uploads.ts`
  - 上传文件落盘
  - 写入 `public/uploads`

- `share.ts`
  - 分享字段解析
  - 分享标题/摘要/封面图优先走文章级覆盖字段

- `qr-code.ts`
  - 本地生成二维码 SVG

- `pagination.ts`
  - 分页辅助逻辑

### 4.4 `src/pages`

- `src/pages/_document.tsx`
  - 自定义文档结构
  - 当前主要是兼容页面基础结构

### 4.5 `src/types`

- `src/types/qrcode.d.ts`
  - `qrcode` 包的本地类型声明

## 5. 数据层地图

### 5.1 Prisma Schema

文件：`prisma/schema.prisma`

核心表：

- `Article`
  - 文章主体
  - 包含标题、摘要、HTML 正文、图片、分享字段、状态、发布时间等

- `Tag`
  - 标签表

- `ArticleTag`
  - 文章与标签的关联表

### 5.2 实际数据文件

- 开发数据库：`prisma/dev.db`
- E2E 数据库：`prisma/e2e.db`
- 公开站点 E2E 数据库：`prisma/e2e-public.db`
- 上传图片目录：`public/uploads/`

### 5.3 当前持久化边界

- 文章正文、标题、状态、分享字段：在 SQLite 中持久化
- 文章图片、分享封面图：在 `public/uploads/` 中持久化
- 服务器正常重启后不会丢
- 删除数据库文件或上传目录才会丢失

## 6. 访问与鉴权链路

### 6.1 后台保护

文件：`middleware.ts`

保护范围：

- `/admin/*`
- `/api/admin/*`

放行例外：

- `/admin/login`
- `/api/admin/login`
- `/api/admin/logout`

### 6.2 登录流程

1. 访问 `/admin/login`
2. 表单提交到 `/api/admin/login`
3. `auth.ts` 校验密码
4. 生成签名 session
5. 写入 `outbaobao_admin_session` cookie
6. 后续访问后台由 `middleware.ts` 检查 cookie

## 7. 公开站点链路

### 7.1 首页

入口：`src/app/page.tsx`

流程：

1. 读取查询参数 `page / q / tag`
2. 调用 `listPublicArticles()`
3. 调用 `listPublicTags()`
4. 渲染文章卡片、搜索、标签、分页

### 7.2 文章详情

入口：`src/app/articles/[slug]/page.tsx`

流程：

1. 根据 `slug` 调用 `getPublicArticleBySlug()`
2. 如果文章不可公开则 `notFound()`
3. 根据文章和分享覆盖字段生成 metadata
4. 渲染正文
5. 提供二维码分享按钮

### 7.3 分享二维码

链路：

1. `article-share-button.tsx` 读取当前页面 URL
2. 拼出 `/api/qr?url=...`
3. `src/app/api/qr/route.ts` 返回二维码 SVG
4. 弹层中以图片形式展示，便于手机长按保存

## 8. 后台写作链路

### 8.1 新建文章

入口：`src/app/admin/articles/new/page.tsx`

提交流程：

1. `article-form.tsx` 收集表单内容
2. 调用 `/api/admin/articles`
3. API 内部调用 `createAdminArticle()`
4. Prisma 写入 SQLite
5. 创建成功后跳转到编辑页

### 8.2 编辑文章

入口：`src/app/admin/articles/[id]/edit/page.tsx`

提交流程：

1. `article-form.tsx` 收集更新内容
2. 调用 `/api/admin/articles/[id]`
3. API 内部调用 `updateAdminArticle()`
4. 更新数据库中的文章和标签

### 8.3 图片上传

链路：

1. 后台表单或富文本编辑器选择图片
2. 提交到 `/api/admin/uploads`
3. `uploads.ts` 写入 `public/uploads`
4. 返回路径 `/uploads/xxx.png`
5. 路径写回文章内容或分享封面字段

## 9. 测试地图

### 单元测试

- `tests/unit/auth.test.ts`
  - 鉴权和 session 相关逻辑

- `tests/unit/articles.test.ts`
  - 公开状态、排序、发布状态归一化

- `tests/unit/share.test.ts`
  - 分享字段回退逻辑
  - 二维码 SVG 生成

### 端到端测试

- `tests/e2e/public-site.spec.ts`
  - 公开首页
  - 公开详情
  - metadata
  - 二维码分享弹层

- `tests/e2e/admin-flow.spec.ts`
  - 后台登录
  - 编辑文章
  - 图片上传
  - 富文本编辑器
  - 分享封面图上传

## 10. 常见维护入口

### 想改公开首页样式或布局

优先看：

- `src/app/page.tsx`
- `src/components/public/article-card.tsx`
- `src/components/public/article-search-form.tsx`
- `src/components/public/tag-filter.tsx`
- `src/app/globals.css`

### 想改文章详情页样式或展示逻辑

优先看：

- `src/app/articles/[slug]/page.tsx`
- `src/components/public/article-share-button.tsx`
- `src/app/globals.css`

### 想改后台编辑体验

优先看：

- `src/components/admin/article-form.tsx`
- `src/components/admin/rich-text-editor.tsx`
- `src/app/globals.css`

### 想改发文状态、公开规则、排序规则

优先看：

- `src/lib/articles.ts`
- `src/lib/admin-articles.ts`

### 想改图片上传策略

优先看：

- `src/app/api/admin/uploads/route.ts`
- `src/lib/uploads.ts`

### 想改登录方式或后台权限

优先看：

- `middleware.ts`
- `src/lib/auth.ts`
- `src/lib/session.ts`
- `src/app/api/admin/login/route.ts`

### 想改分享卡片内容

优先看：

- `src/lib/share.ts`
- `src/app/articles/[slug]/page.tsx`
- `src/components/admin/article-form.tsx`

## 11. 关键环境变量

- `ADMIN_PASSWORD`
  - 后台登录密码

- `SESSION_SECRET`
  - session 签名密钥

- `SITE_URL`
  - 站点完整域名
  - 对登录跳转、分享、生产部署很重要

- `DATABASE_URL`
  - Prisma 使用的 SQLite 地址
  - 本地默认是 `file:./dev.db`

## 12. 当前维护建议

- `src/app/globals.css` 现在承担了全站样式，后续页面继续增多时，建议拆分为：
  - 公共样式
  - 后台样式
  - 公开页样式
  - 分享弹层样式

- `src/components/admin/article-form.tsx` 已经承担较多状态和提交逻辑，后续如果再加功能，建议拆分：
  - 基础字段区
  - 分享字段区
  - 发布设置区
  - 提交逻辑 hook

- `admin-articles.ts` 目前既负责 seed、仓储、slug、标签处理，后续复杂度再升时可继续拆为：
  - repository
  - seed
  - tag helpers
  - slug helpers

## 13. 后续查看顺序建议

如果下次继续开发，建议按下面顺序恢复上下文：

1. 先看本文档 `docs/project-map.md`
2. 再看 `docs/superpowers/plans/2026-05-14-online-bulletin-board-breakpoint.md`
3. 如需理解原始设计，再看 `docs/superpowers/specs/2026-05-13-online-bulletin-board-design.md`
4. 真正改功能时，再进入对应页面、组件和 `src/lib` 文件
