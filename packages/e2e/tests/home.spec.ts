import { expect, test } from "@playwright/test";

const MY_APP_TITLE_PATTERN = /My App/;

test.describe("Home Page", () => {
	test("should load the home page", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveTitle(MY_APP_TITLE_PATTERN);
	});

	test("should display API status section", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByText("API Status")).toBeVisible();
	});
});
