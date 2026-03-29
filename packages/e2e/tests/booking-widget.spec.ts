import { expect, test } from "@playwright/test";

test.describe("Booking Widget", () => {
  test("loads with calendar showing Select a Date", async ({ page }) => {
    await page.goto("/booking");
    await expect(page.locator("text=Select a Date")).toBeVisible();
  });

  test("advances to timeslots after selecting a future date", async ({
    page,
  }) => {
    await page.goto("/booking");
    await expect(page.locator("text=Select a Date")).toBeVisible();

    // Click a future date (e.g., day 20 if today is earlier in month)
    await page.locator('[aria-label="June 20"]').click();
    await expect(page.locator("text=Select a time slot")).toBeVisible();
  });

  test("advances to form after selecting a timeslot", async ({ page }) => {
    await page.goto("/booking");

    // Select date
    await page.locator('[aria-label="June 20"]').click();
    await expect(page.locator("text=Select a time slot")).toBeVisible();

    // Select timeslot
    await page.locator("text=09:00").click();
    await expect(page.locator("text=Complete Your Booking")).toBeVisible();
  });

  test("back button from timeslots returns to calendar", async ({ page }) => {
    await page.goto("/booking");

    // Select date
    await page.locator('[aria-label="June 20"]').click();
    await expect(page.locator("text=Select a time slot")).toBeVisible();

    // Click back
    const backButton = await page.locator("button:has-text('Back')").first();
    await backButton.click();
    await expect(page.locator("text=Select a Date")).toBeVisible();
  });

  test("back button from form returns to timeslots", async ({ page }) => {
    await page.goto("/booking");

    // Select date
    await page.locator('[aria-label="June 20"]').click();
    await expect(page.locator("text=Select a time slot")).toBeVisible();

    // Select timeslot
    await page.locator("text=09:00").click();
    await expect(page.locator("text=Complete Your Booking")).toBeVisible();

    // Click back
    const backButton = await page.locator("button:has-text('Back')").first();
    await backButton.click();
    await expect(page.locator("text=Select a time slot")).toBeVisible();
  });

  test("shows success after successful submission", async ({ page }) => {
    // Intercept the submission endpoint and respond with success
    await page.route("**/api/bookings", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto("/booking");

    // Select date
    await page.locator('[aria-label="June 20"]').click();

    // Select timeslot
    await page.locator("text=09:00").click();

    // Fill email
    await page.fill('input[placeholder="you@example.com"]', "test@example.com");

    // Submit
    await page.locator("button:has-text('Confirm Booking')").click();

    await expect(page.locator("text=Booking Confirmed!")).toBeVisible();
  });

  test("shows error on failed submission", async ({ page }) => {
    // Intercept the submission endpoint and respond with error
    await page.route("**/api/bookings", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Server error" }),
      });
    });

    await page.goto("/booking");

    // Select date
    await page.locator('[aria-label="June 20"]').click();

    // Select timeslot
    await page.locator("text=09:00").click();

    // Fill email
    await page.fill('input[placeholder="you@example.com"]', "test@example.com");

    // Submit
    await page.locator("button:has-text('Confirm Booking')").click();

    // Check for error message (implementation dependent)
    await expect(page.locator("text=/error|failed/i")).toBeVisible({
      timeout: 5000,
    });
  });

  test("Book Another Time resets to calendar", async ({ page }) => {
    // Intercept the submission endpoint
    await page.route("**/api/bookings", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto("/booking");

    // Complete booking flow
    await page.locator('[aria-label="June 20"]').click();
    await page.locator("text=09:00").click();
    await page.fill('input[placeholder="you@example.com"]', "test@example.com");
    await page.locator("button:has-text('Confirm Booking')").click();

    await expect(page.locator("text=Booking Confirmed!")).toBeVisible();

    // Click "Book Another Time"
    await page.locator("button:has-text('Book Another Time')").click();

    await expect(page.locator("text=Select a Date")).toBeVisible();
  });
});
