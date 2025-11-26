import { expect, test } from "@playwright/test";

test("homepage loads successfully", async ({ page }) => {
  await page.goto("/");
  const heading = page.locator("h1");
  await expect(heading).toHaveCount(1);
});
