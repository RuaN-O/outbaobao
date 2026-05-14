import { expect, test } from "@playwright/test";

test("admin can log in and open the new article form", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("访问密码").fill("secret");
  await page.getByRole("button", { name: "进入后台" }).click();
  await expect(page).toHaveURL("/admin");
  await page.getByRole("link", { name: "新建文章" }).click();
  await expect(page).toHaveURL("/admin/articles/new");
});
