import { expect, test } from "@playwright/test";

const TITLE_PATTERN = /yellow|home/i;

test("index page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(TITLE_PATTERN);
  await page.waitForLoadState("networkidle");
  expect(page.url()).toContain("localhost");
});
