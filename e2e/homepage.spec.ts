import { expect, test } from "@playwright/test";

test("homepage loads successfully", async ({ page }) => {
  await page.goto("/");
  const heading = page.locator("h1, h2");
  await expect(heading).toBeVisible();
});
