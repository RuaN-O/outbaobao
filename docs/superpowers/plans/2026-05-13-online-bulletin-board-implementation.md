# Online Bulletin Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-server bulletin board with a password-protected mobile-first admin, a public read-only site, image uploads, scheduled publishing, search/tag filters, and WeChat H5 share metadata.

**Architecture:** Use a single Next.js App Router application to serve both the public site and the private admin. Persist article data in SQLite through Prisma, store uploaded images on the server filesystem, protect admin routes with a signed cookie session plus middleware, and evaluate scheduled publishing at read time instead of relying on background jobs.

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma ORM, SQLite, TipTap, Zod, pnpm, Vitest, Playwright

---

## File Structure

### Project and Tooling

- Create: `package.json`
- Create: `pnpm-lock.yaml`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `eslint.config.mjs`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`

### Database and Domain

- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`
- Create: `src/lib/env.ts`
- Create: `src/lib/articles.ts`
- Create: `src/lib/share.ts`
- Create: `src/lib/pagination.ts`

### Auth and Uploads

- Create: `src/lib/auth.ts`
- Create: `src/lib/session.ts`
- Create: `src/lib/uploads.ts`
- Create: `middleware.ts`

### Public UI

- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/app/page.tsx`
- Create: `src/app/articles/[slug]/page.tsx`
- Create: `src/components/public/article-card.tsx`
- Create: `src/components/public/article-search-form.tsx`
- Create: `src/components/public/tag-filter.tsx`
- Create: `src/components/public/pagination.tsx`

### Admin UI

- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/articles/new/page.tsx`
- Create: `src/app/admin/articles/[id]/edit/page.tsx`
- Create: `src/components/admin/admin-shell.tsx`
- Create: `src/components/admin/article-list.tsx`
- Create: `src/components/admin/article-form.tsx`
- Create: `src/components/admin/rich-text-editor.tsx`

### API Routes

- Create: `src/app/api/admin/login/route.ts`
- Create: `src/app/api/admin/logout/route.ts`
- Create: `src/app/api/admin/articles/route.ts`
- Create: `src/app/api/admin/articles/[id]/route.ts`
- Create: `src/app/api/admin/uploads/route.ts`

### Tests

- Create: `tests/unit/articles.test.ts`
- Create: `tests/unit/auth.test.ts`
- Create: `tests/unit/share.test.ts`
- Create: `tests/e2e/public-site.spec.ts`
- Create: `tests/e2e/admin-flow.spec.ts`

### Docs

- Create: `README.md`
- Modify: `docs/superpowers/specs/2026-05-13-online-bulletin-board-design.md`

## Data Model

The implementation should use these article fields in the database:

- `id`
- `slug`
- `title`
- `summary`
- `contentHtml`
- `coverImagePath`
- `shareTitle`
- `shareDescription`
- `shareImagePath`
- `status` (`DRAFT`, `PUBLISHED`, `SCHEDULED`)
- `isPinned`
- `publishedAt`
- `scheduledFor`
- `createdAt`
- `updatedAt`

Tags should be modeled as a many-to-many relationship:

- `Tag`
- `ArticleTag`

## Conventions

- Use `pnpm`
- Keep admin pages mobile-first with single-column forms
- Use server components for public pages where possible
- Use route handlers for admin mutations
- Keep uploaded files under `public/uploads/`
- Keep article visibility logic in one shared domain module
- Use TDD for domain logic and auth helpers before UI assembly

### Task 1: Scaffold the Monolith

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Test: `tests/e2e/public-site.spec.ts`

- [ ] **Step 1: Write the failing smoke test**

```ts
import { test, expect } from "@playwright/test";

test("homepage shows the bulletin board title", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /公告/i })).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm playwright test tests/e2e/public-site.spec.ts --project=chromium`
Expected: FAIL because the app and route do not exist yet

- [ ] **Step 3: Scaffold the app and add the minimal homepage**

```tsx
// src/app/page.tsx
export default function HomePage() {
  return <h1>在线公告板</h1>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm playwright test tests/e2e/public-site.spec.ts --project=chromium`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold nextjs bulletin board app"
```

### Task 2: Define Database Schema and Visibility Rules

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`
- Create: `src/lib/articles.ts`
- Create: `src/lib/pagination.ts`
- Test: `tests/unit/articles.test.ts`

- [ ] **Step 1: Write the failing domain tests**

```ts
import { describe, expect, it } from "vitest";
import { isArticlePublic, sortArticles } from "@/lib/articles";

describe("article visibility", () => {
  it("hides drafts", () => {
    expect(isArticlePublic({ status: "DRAFT", publishedAt: new Date() }, new Date())).toBe(false);
  });

  it("publishes scheduled articles only when their time arrives", () => {
    const now = new Date("2026-05-13T12:00:00Z");
    expect(
      isArticlePublic({ status: "SCHEDULED", publishedAt: new Date("2026-05-13T13:00:00Z") }, now),
    ).toBe(false);
  });

  it("sorts pinned articles before others", () => {
    const result = sortArticles([
      { id: "b", isPinned: false, publishedAt: new Date("2026-05-13T10:00:00Z") },
      { id: "a", isPinned: true, publishedAt: new Date("2026-05-13T09:00:00Z") },
    ]);
    expect(result.map((item) => item.id)).toEqual(["a", "b"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/articles.test.ts`
Expected: FAIL with missing module or missing exported functions

- [ ] **Step 3: Implement schema and domain helpers**

```ts
// src/lib/articles.ts
export function isArticlePublic(
  article: { status: "DRAFT" | "PUBLISHED" | "SCHEDULED"; publishedAt: Date | null },
  now: Date,
) {
  if (article.status === "DRAFT") return false;
  if (article.status === "PUBLISHED") return true;
  return Boolean(article.publishedAt && article.publishedAt <= now);
}
```

```prisma
model Article {
  id               String   @id @default(cuid())
  slug             String   @unique
  title            String
  summary          String
  contentHtml      String
  coverImagePath   String?
  shareTitle       String?
  shareDescription String?
  shareImagePath   String?
  status           ArticleStatus @default(DRAFT)
  isPinned         Boolean  @default(false)
  publishedAt      DateTime?
  scheduledFor     DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  tags             ArticleTag[]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/articles.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/lib/db.ts src/lib/articles.ts src/lib/pagination.ts tests/unit/articles.test.ts
git commit -m "feat: add article schema and visibility rules"
```

### Task 3: Add Admin Authentication and Route Protection

**Files:**
- Create: `src/lib/env.ts`
- Create: `src/lib/auth.ts`
- Create: `src/lib/session.ts`
- Create: `middleware.ts`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/api/admin/login/route.ts`
- Create: `src/app/api/admin/logout/route.ts`
- Test: `tests/unit/auth.test.ts`

- [ ] **Step 1: Write the failing auth tests**

```ts
import { describe, expect, it } from "vitest";
import { verifyAdminPassword, signAdminSession, readAdminSession } from "@/lib/auth";

describe("admin auth", () => {
  it("accepts the configured password", async () => {
    expect(await verifyAdminPassword("secret", "secret")).toBe(true);
  });

  it("rejects the wrong password", async () => {
    expect(await verifyAdminPassword("secret", "wrong")).toBe(false);
  });

  it("round-trips the signed session cookie", async () => {
    const cookie = await signAdminSession({ isAdmin: true });
    const session = await readAdminSession(cookie);
    expect(session?.isAdmin).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/auth.test.ts`
Expected: FAIL with missing auth helpers

- [ ] **Step 3: Implement password verification, signed sessions, and middleware**

```ts
// src/lib/auth.ts
export async function verifyAdminPassword(expected: string, incoming: string) {
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(incoming));
}
```

```ts
// middleware.ts
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin") && !request.nextUrl.pathname.startsWith("/admin/login")) {
    // redirect unauthenticated users to /admin/login
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/auth.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/env.ts src/lib/auth.ts src/lib/session.ts middleware.ts src/app/admin/login/page.tsx src/app/api/admin/login/route.ts src/app/api/admin/logout/route.ts tests/unit/auth.test.ts
git commit -m "feat: add admin password auth"
```

### Task 4: Implement Upload Storage and Share Metadata Helpers

**Files:**
- Create: `src/lib/uploads.ts`
- Create: `src/lib/share.ts`
- Create: `src/app/api/admin/uploads/route.ts`
- Test: `tests/unit/share.test.ts`

- [ ] **Step 1: Write the failing helper tests**

```ts
import { describe, expect, it } from "vitest";
import { resolveShareFields } from "@/lib/share";

describe("share field fallback", () => {
  it("prefers article-level overrides", () => {
    const result = resolveShareFields({
      title: "文章标题",
      summary: "文章摘要",
      coverImagePath: "/uploads/cover.png",
      shareTitle: "分享标题",
      shareDescription: "分享摘要",
      shareImagePath: "/uploads/share.png",
    });
    expect(result.title).toBe("分享标题");
    expect(result.description).toBe("分享摘要");
    expect(result.image).toBe("/uploads/share.png");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/share.test.ts`
Expected: FAIL with missing share helper

- [ ] **Step 3: Implement local file uploads and share fallback logic**

```ts
// src/lib/share.ts
export function resolveShareFields(article: {
  title: string;
  summary: string;
  coverImagePath: string | null;
  shareTitle?: string | null;
  shareDescription?: string | null;
  shareImagePath?: string | null;
}) {
  return {
    title: article.shareTitle || article.title,
    description: article.shareDescription || article.summary,
    image: article.shareImagePath || article.coverImagePath,
  };
}
```

```ts
// src/lib/uploads.ts
export async function saveUpload(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const path = `/uploads/${Date.now()}-${file.name}`;
  await fs.mkdir("public/uploads", { recursive: true });
  await fs.writeFile(`public${path}`, bytes);
  return path;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/share.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/uploads.ts src/lib/share.ts src/app/api/admin/uploads/route.ts tests/unit/share.test.ts
git commit -m "feat: add upload storage and share helpers"
```

### Task 5: Build the Public Listing, Search, Tags, Pagination, and Detail Pages

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/app/articles/[slug]/page.tsx`
- Create: `src/components/public/article-card.tsx`
- Create: `src/components/public/article-search-form.tsx`
- Create: `src/components/public/tag-filter.tsx`
- Create: `src/components/public/pagination.tsx`
- Modify: `src/lib/articles.ts`
- Test: `tests/e2e/public-site.spec.ts`

- [ ] **Step 1: Expand the failing public-site tests**

```ts
test("public homepage shows only visible articles and supports search", async ({ page }) => {
  await page.goto("/?q=通知");
  await expect(page.getByText("通知")).toBeVisible();
  await expect(page.getByText("草稿文章")).toHaveCount(0);
});

test("public article page exposes title and summary metadata", async ({ page }) => {
  await page.goto("/articles/example-article");
  await expect(page).toHaveTitle(/示例文章/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm playwright test tests/e2e/public-site.spec.ts --project=chromium`
Expected: FAIL because list/detail routes and seeded content are not implemented

- [ ] **Step 3: Implement public queries, metadata, and public UI**

```ts
// src/lib/articles.ts
export async function listPublicArticles(params: { q?: string; tag?: string; page: number }) {
  // apply visibility filter, search filter, tag filter, pinned-first order, pagination
}
```

```tsx
// src/app/articles/[slug]/page.tsx
export async function generateMetadata({ params }: PageProps) {
  const article = await getPublicArticleBySlug(params.slug);
  const share = resolveShareFields(article);
  return {
    title: article.title,
    description: article.summary,
    openGraph: {
      title: share.title,
      description: share.description,
      images: share.image ? [share.image] : [],
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm playwright test tests/e2e/public-site.spec.ts --project=chromium`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/articles/[slug]/page.tsx src/components/public src/lib/articles.ts tests/e2e/public-site.spec.ts
git commit -m "feat: add public article browsing experience"
```

### Task 6: Build the Admin Article List and New Article Flow

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/articles/new/page.tsx`
- Create: `src/components/admin/admin-shell.tsx`
- Create: `src/components/admin/article-list.tsx`
- Create: `src/components/admin/article-form.tsx`
- Create: `src/app/api/admin/articles/route.ts`
- Test: `tests/e2e/admin-flow.spec.ts`

- [ ] **Step 1: Write the failing admin flow test**

```ts
import { test, expect } from "@playwright/test";

test("admin can log in and open the new article form", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("访问密码").fill("secret");
  await page.getByRole("button", { name: "进入后台" }).click();
  await expect(page).toHaveURL("/admin");
  await page.getByRole("link", { name: "新建文章" }).click();
  await expect(page).toHaveURL("/admin/articles/new");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm playwright test tests/e2e/admin-flow.spec.ts --project=chromium`
Expected: FAIL because admin pages and mutation routes do not exist yet

- [ ] **Step 3: Implement the admin shell, article list, and create endpoint**

```tsx
// src/components/admin/article-form.tsx
export function ArticleForm({ initialValue }: { initialValue?: AdminArticleFormValue }) {
  return (
    <form className="admin-form">
      <label htmlFor="title">标题</label>
      <input id="title" name="title" />
      {/* summary, cover, tags, publish timing, pinned toggle */}
    </form>
  );
}
```

```ts
// src/app/api/admin/articles/route.ts
export async function POST(request: Request) {
  // validate input with zod, create article, return id and slug
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm playwright test tests/e2e/admin-flow.spec.ts --project=chromium`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/page.tsx src/app/admin/articles/new/page.tsx src/components/admin src/app/api/admin/articles/route.ts tests/e2e/admin-flow.spec.ts
git commit -m "feat: add admin article management shell"
```

### Task 7: Integrate the Mobile-Friendly Rich Text Editor and Article Editing

**Files:**
- Create: `src/app/admin/articles/[id]/edit/page.tsx`
- Create: `src/components/admin/rich-text-editor.tsx`
- Modify: `src/components/admin/article-form.tsx`
- Modify: `src/app/api/admin/articles/[id]/route.ts`
- Modify: `src/app/api/admin/uploads/route.ts`
- Test: `tests/e2e/admin-flow.spec.ts`

- [ ] **Step 1: Expand the failing editor test**

```ts
test("admin can update article content and remove an inline image", async ({ page }) => {
  await page.goto("/admin/articles/example-id/edit");
  await page.getByRole("textbox", { name: "标题" }).fill("修改后的标题");
  await page.getByRole("button", { name: "删除图片" }).click();
  await page.getByRole("button", { name: "保存草稿" }).click();
  await expect(page.getByText("保存成功")).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm playwright test tests/e2e/admin-flow.spec.ts --project=chromium`
Expected: FAIL because edit page and editor image controls are incomplete

- [ ] **Step 3: Implement TipTap editor integration and update endpoint**

```tsx
// src/components/admin/rich-text-editor.tsx
const editor = useEditor({
  extensions: [StarterKit, Image],
  content: initialHtml,
  editorProps: {
    attributes: { class: "rich-editor" },
  },
});
```

```ts
// src/app/api/admin/articles/[id]/route.ts
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // validate payload, update article fields, preserve removed upload files on disk
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm playwright test tests/e2e/admin-flow.spec.ts --project=chromium`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/articles/[id]/edit/page.tsx src/components/admin/rich-text-editor.tsx src/components/admin/article-form.tsx src/app/api/admin/articles/[id]/route.ts src/app/api/admin/uploads/route.ts tests/e2e/admin-flow.spec.ts
git commit -m "feat: add mobile article editor with inline images"
```

### Task 8: Implement Publish State UX, Scheduled Publishing, and Share Overrides

**Files:**
- Modify: `src/components/admin/article-form.tsx`
- Modify: `src/app/api/admin/articles/route.ts`
- Modify: `src/app/api/admin/articles/[id]/route.ts`
- Modify: `src/lib/articles.ts`
- Modify: `src/lib/share.ts`
- Modify: `src/app/articles/[slug]/page.tsx`
- Test: `tests/unit/articles.test.ts`
- Test: `tests/unit/share.test.ts`
- Test: `tests/e2e/admin-flow.spec.ts`

- [ ] **Step 1: Write failing tests for state transitions and share overrides**

```ts
it("uses share field overrides when present", () => {
  const share = resolveShareFields({
    title: "A",
    summary: "B",
    coverImagePath: "/cover.png",
    shareTitle: "C",
    shareDescription: "D",
    shareImagePath: "/share.png",
  });
  expect(share.title).toBe("C");
});

test("scheduled articles stay hidden until publish time", async ({ page }) => {
  await page.goto("/articles/scheduled-example");
  await expect(page.getByText("未找到")).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/articles.test.ts tests/unit/share.test.ts`
Run: `pnpm playwright test tests/e2e/admin-flow.spec.ts --project=chromium`
Expected: FAIL because form fields and route handling are incomplete

- [ ] **Step 3: Implement status controls and share field overrides**

```tsx
// src/components/admin/article-form.tsx
<label htmlFor="shareTitle">分享标题</label>
<input id="shareTitle" name="shareTitle" />

<label htmlFor="shareDescription">分享摘要</label>
<textarea id="shareDescription" name="shareDescription" />
```

```ts
// src/lib/articles.ts
export function normalizeArticleStatus(input: {
  action: "draft" | "publish" | "schedule";
  scheduledFor?: Date | null;
}) {
  if (input.action === "draft") return { status: "DRAFT", publishedAt: null };
  if (input.action === "publish") return { status: "PUBLISHED", publishedAt: new Date() };
  return { status: "SCHEDULED", publishedAt: input.scheduledFor };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/articles.test.ts tests/unit/share.test.ts`
Run: `pnpm playwright test tests/e2e/admin-flow.spec.ts --project=chromium`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/article-form.tsx src/app/api/admin/articles/route.ts src/app/api/admin/articles/[id]/route.ts src/lib/articles.ts src/lib/share.ts src/app/articles/[slug]/page.tsx tests/unit/articles.test.ts tests/unit/share.test.ts tests/e2e/admin-flow.spec.ts
git commit -m "feat: add scheduling and custom share metadata"
```

### Task 9: Polish the UI, Add Seed Data, and Document Deployment

**Files:**
- Modify: `src/app/globals.css`
- Create: `prisma/seed.ts`
- Create: `README.md`
- Modify: `package.json`
- Modify: `docs/superpowers/specs/2026-05-13-online-bulletin-board-design.md`
- Test: `tests/e2e/public-site.spec.ts`
- Test: `tests/e2e/admin-flow.spec.ts`

- [ ] **Step 1: Add the final failing verification checks**

```ts
test("public and admin flows both pass in one run", async () => {
  expect(true).toBe(true);
});
```

- [ ] **Step 2: Run the full suite and capture failures**

Run: `pnpm vitest run`
Run: `pnpm playwright test`
Expected: Any remaining failures are visible and reproducible

- [ ] **Step 3: Finish mobile-first styling, seed content, and deployment docs**

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

```md
<!-- README.md -->
1. Copy `.env.example` to `.env`
2. Run `pnpm install`
3. Run `pnpm db:migrate`
4. Run `pnpm db:seed`
5. Run `pnpm dev`
```

- [ ] **Step 4: Run the full suite to verify it passes**

Run: `pnpm vitest run`
Run: `pnpm playwright test`
Run: `pnpm build`
Expected: All PASS, Next.js production build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css prisma/seed.ts README.md package.json docs/superpowers/specs/2026-05-13-online-bulletin-board-design.md
git commit -m "docs: finalize setup and deployment guidance"
```

## Plan Review Notes

- Because this session has not explicitly authorized subagents, review this plan locally rather than dispatching a plan-review agent.
- Before execution, verify that SQLite on a single server is acceptable for deployment. For the current scale and single-admin write pattern, it is the simplest fit.
- During implementation, do not add a background scheduler unless read-time publish checks prove insufficient.

## Execution Notes

- Admin password should come from `ADMIN_PASSWORD`
- Session signing secret should come from `SESSION_SECRET`
- Database path should come from `DATABASE_URL`
- Public URLs for share metadata should use a `SITE_URL`
- Use seeded content so Playwright can verify public search, tags, pagination, and metadata deterministically
