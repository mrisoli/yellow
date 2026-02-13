import { expect, test } from "@playwright/test";

test.describe("Home Page", () => {
	test("should load the home page", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveTitle(/My App/);
	});

	test("should display API status section", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByText("API Status")).toBeVisible();
	});
});
