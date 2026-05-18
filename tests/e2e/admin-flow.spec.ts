import { expect, test } from "@playwright/test";

test("anonymous visitors are redirected to admin login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("admin pages use the site title instead of Next.js", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page).toHaveTitle(/内容/);
});

test("admin can log in and open the new article form", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("访问密码").fill("secret");
  await page.getByRole("button", { name: "进入后台" }).click();
  await expect(page).toHaveURL("/admin");
  await page.getByRole("link", { name: "新建文章" }).click();
  await expect(page).toHaveURL("/admin/articles/new");
});

test("admin can update article content and remove an inline image", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("访问密码").fill("secret");
  await page.getByRole("button", { name: "进入后台" }).click();
  await expect(page).toHaveURL("/admin");

  await page.goto("/admin/articles/example-id/edit");
  await page.getByLabel("标题").fill("修改后的标题");
  await page.getByLabel("添加图片").setInputFiles({
    name: "inline-image.png",
    mimeType: "image/png",
    buffer: Buffer.from("fake-image-content"),
  });
  await page.getByRole("button", { name: "删除图片" }).click();
  await page.getByRole("button", { name: "立即发布" }).click();
  await expect(page.getByText("保存成功")).toBeVisible();

  await page.goto("/articles/example-article");
  await expect(page.getByRole("heading", { name: "修改后的标题" })).toBeVisible();
});

test("admin can upload an inline image", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("访问密码").fill("secret");
  await page.getByRole("button", { name: "进入后台" }).click();
  await expect(page).toHaveURL("/admin");

  await page.goto("/admin/articles/example-id/edit");
  await page.getByLabel("添加图片").setInputFiles({
    name: "inline-image.png",
    mimeType: "image/png",
    buffer: Buffer.from("fake-image-content"),
  });

  await expect(page.locator("span").filter({ hasText: /\/uploads\// })).toBeVisible();
});

test("admin sees a lightweight rich text toolbar on mobile editor", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("访问密码").fill("secret");
  await page.getByRole("button", { name: "进入后台" }).click();
  await expect(page).toHaveURL("/admin");

  await page.goto("/admin/articles/example-id/edit");
  await expect(page.getByRole("button", { name: "小标题" })).toBeVisible();
  await expect(page.getByRole("button", { name: "加粗" })).toBeVisible();
  await expect(page.getByRole("button", { name: "引用" })).toBeVisible();
  await expect(page.locator("[contenteditable='true']")).toBeVisible();
});

test("admin can upload a share cover image", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("访问密码").fill("secret");
  await page.getByRole("button", { name: "进入后台" }).click();
  await expect(page).toHaveURL("/admin");

  await page.goto("/admin/articles/example-id/edit");
  await page.getByLabel("上传分享封面图").setInputFiles({
    name: "share-cover.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
        <rect width="640" height="360" fill="#f97316" />
        <circle cx="470" cy="180" r="110" fill="#111827" />
      </svg>`,
    ),
  });

  await expect(page.getByLabel("分享封面图地址")).toHaveValue(/\/uploads\//);
});

test("admin can delete an article from the list", async ({ page }) => {
  const title = `待删除文章 ${Date.now()}`;

  await page.goto("/admin/login");
  await page.getByLabel("访问密码").fill("secret");
  await page.getByRole("button", { name: "进入后台" }).click();
  await expect(page).toHaveURL("/admin");

  await page.getByRole("link", { name: "新建文章" }).click();
  await expect(page).toHaveURL("/admin/articles/new");

  await page.getByLabel("标题").fill(title);
  await page.locator("#summary").fill("用于删除测试");
  await page.getByRole("button", { name: "立即发布" }).click();
  await expect(page).toHaveURL(/\/admin\/articles\/[^/]+\/edit$/);

  await page.goto("/admin");
  const articleCard = page.locator(".article-card").filter({ hasText: title });
  await expect(articleCard).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await articleCard.getByRole("button", { name: "删除文章" }).click();

  await expect(articleCard).toHaveCount(0);
});

test("admin article form hides advanced fields and uses immediate publish by default", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("访问密码").fill("secret");
  await page.getByRole("button", { name: "进入后台" }).click();
  await expect(page).toHaveURL("/admin");

  await page.goto("/admin/articles/new");

  await expect(page.getByLabel("标签")).toHaveCount(0);
  await expect(page.getByLabel("分享卡片主文案")).toHaveCount(0);
  await expect(page.getByLabel("发布状态")).toHaveCount(0);
  await expect(page.getByLabel("定时发布时间")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "保存草稿" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "定时发布" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "立即发布" })).toHaveCount(1);
});

test("admin can add a second content block and move it upward immediately", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("访问密码").fill("secret");
  await page.getByRole("button", { name: "进入后台" }).click();
  await expect(page).toHaveURL("/admin");

  await page.goto("/admin/articles/new");
  await expect(page.getByRole("button", { name: "新增正文块" })).toBeVisible();
  await expect(page.locator("[contenteditable='true']")).toHaveCount(1);

  await page.getByRole("button", { name: "新增正文块" }).click();
  await expect(page.locator("[contenteditable='true']")).toHaveCount(2);

  await page.locator("[contenteditable='true']").nth(0).click();
  await page.keyboard.insertText("第一块");
  await page.locator("[contenteditable='true']").nth(1).click();
  await page.keyboard.insertText("第二块");

  await page.locator(".content-block-card").nth(1).getByRole("button", { name: "上移" }).click();
  await expect(page.locator("[contenteditable='true']").nth(0)).toContainText("第二块");
  await expect(page.locator("[contenteditable='true']").nth(1)).toContainText("第一块");
});
