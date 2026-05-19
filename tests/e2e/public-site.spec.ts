import { expect, test } from "@playwright/test";

test("homepage shows the bulletin board subtitle", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("公开展示已发布内容，支持搜索、标签筛选和单篇分享。")).toBeVisible();
});

test("public homepage shows only visible articles and supports search", async ({ page }) => {
  await page.goto("/?q=通知");
  await expect(page.getByText("通知")).toBeVisible();
  await expect(page.getByText("草稿文章")).toHaveCount(0);
});

test("public article page exposes title and summary metadata", async ({ page }) => {
  await page.goto("/articles/example-article");
  const heading = page.getByRole("heading", { level: 1 });
  const headingText = (await heading.textContent())?.trim() ?? "";

  expect(headingText).not.toBe("");
  await expect(page).toHaveTitle(new RegExp(headingText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("public article detail pages show the summary image, but the homepage list does not", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("访问密码").fill("secret");
  await page.getByRole("button", { name: "进入后台" }).click();
  await expect(page).toHaveURL("/admin");

  await page.goto("/admin/articles/example-id/edit");
  await page.getByRole("textbox", { name: "摘要配图" }).fill("/uploads/example-summary.svg");
  await page.getByRole("button", { name: "立即发布" }).click();
  await expect(page.getByText("保存成功")).toBeVisible();

  await page.goto("/");
  await expect(page.getByAltText("摘要配图")).toHaveCount(0);

  await page.goto("/articles/example-article");
  await expect(page.getByAltText("摘要配图")).toBeVisible();
});

test("public article detail pages do not render an empty summary block", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("璁块棶瀵嗙爜").fill("secret");
  await page.getByRole("button", { name: "杩涘叆鍚庡彴" }).click();
  await expect(page).toHaveURL("/admin");

  await page.goto("/admin/articles/example-id/edit");
  await page.locator("#summary").fill("");
  await page.getByRole("button", { name: "绔嬪嵆鍙戝竷" }).click();
  await expect(page.getByText("淇濆瓨鎴愬姛")).toBeVisible();

  await page.goto("/articles/example-article");
  await expect(page.locator("p.article-summary")).toHaveCount(0);
});

test("public article titles stay inside the article card when the title is very long", async ({ page }) => {
  const longTitle = "LONGTITLE".repeat(24);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/login");
  await page.getByLabel("访问密码").fill("secret");
  await page.getByRole("button", { name: "进入后台" }).click();
  await expect(page).toHaveURL("/admin");

  await page.goto("/admin/articles/example-id/edit");
  await page.getByLabel("标题").fill(longTitle);
  await page.getByRole("button", { name: "立即发布" }).click();
  await expect(page.getByText("保存成功")).toBeVisible();

  await page.goto("/articles/example-article");

  const articleBox = await page.locator(".article-detail").boundingBox();
  const titleBox = await page.getByRole("heading", { level: 1 }).boundingBox();

  expect(articleBox).not.toBeNull();
  expect(titleBox).not.toBeNull();
  expect((titleBox?.x ?? 0) + (titleBox?.width ?? 0)).toBeLessThanOrEqual((articleBox?.x ?? 0) + (articleBox?.width ?? 0) + 1);
});

test("anonymous visitors do not see the share button on public article pages", async ({ page }) => {
  await page.goto("/articles/example-article");
  await expect(page.getByRole("button", { name: "分享" })).toHaveCount(0);
});

test("admin viewers can open the QR share modal on public article pages", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("访问密码").fill("secret");
  await page.getByRole("button", { name: "进入后台" }).click();
  await expect(page).toHaveURL("/admin");

  await page.goto("/articles/example-article");
  await page.getByRole("button", { name: "分享" }).click();

  await expect(page.getByRole("dialog", { name: "文章分享二维码" })).toBeVisible();

  const qrImage = page.getByRole("img", { name: "文章分享二维码" });
  await expect(qrImage).toBeVisible();
  await expect(qrImage).toHaveAttribute("src", /\/api\/qr\?url=/);
});
