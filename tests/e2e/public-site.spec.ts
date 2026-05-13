import { expect, test } from "@playwright/test";

test("homepage shows the bulletin board title", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /公告/i })).toBeVisible();
});
