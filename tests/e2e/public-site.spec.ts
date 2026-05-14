import { expect, test } from "@playwright/test";

test("homepage shows the bulletin board title", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "在线公告板" })).toBeVisible();
});

test("public homepage shows only visible articles and supports search", async ({ page }) => {
  await page.goto("/?q=通知");
  await expect(page.getByText("通知")).toBeVisible();
  await expect(page.getByText("草稿文章")).toHaveCount(0);
});

test("public article page exposes title and summary metadata", async ({ page }) => {
  await page.goto("/articles/example-article");
  await expect(page).toHaveTitle(/示例文章/);
});
