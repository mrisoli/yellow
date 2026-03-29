import { expect, test } from "@playwright/test";

test("index page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/yellow|home/i);
  await page.waitForLoadState("networkidle");
  expect(page.url()).toContain("localhost");
});
