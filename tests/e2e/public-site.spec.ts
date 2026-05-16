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
