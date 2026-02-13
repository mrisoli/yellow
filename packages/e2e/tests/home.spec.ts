import { expect, test } from "@playwright/test";

test.describe("Home Page", () => {
	test("should load the home page", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveTitle(/My App/);
	});

	test("should display the title text", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("pre")).toContainText("BETTER");
	});

	test("should display API status section", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByText("API Status")).toBeVisible();
	});

	test("should show API connection status", async ({ page }) => {
		await page.goto("/");
		const statusSection = page.locator("section").filter({ hasText: "API Status" });
		await expect(statusSection).toBeVisible();
		// The status should be either "Checking...", "Connected", or "Error"
		await expect(statusSection.locator("span")).toBeVisible();
	});
});
