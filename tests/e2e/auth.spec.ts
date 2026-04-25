import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env["E2E_TEST_EMAIL"] ?? "alice@example.dev";
const TEST_PASSWORD = process.env["E2E_TEST_PASSWORD"] ?? "Password123!";

test.describe("Authentication", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in|log in|welcome/i })).toBeVisible();
  });

  test("unauthenticated redirect from /feed goes to /login", async ({ page }) => {
    await page.goto("/feed");
    await expect(page).toHaveURL(/login/);
  });

  test("unauthenticated redirect from /ideas goes to /login", async ({ page }) => {
    await page.goto("/ideas");
    await expect(page).toHaveURL(/login/);
  });

  test("unauthenticated redirect from /settings goes to /login", async ({ page }) => {
    await page.goto("/settings/profile");
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Authenticated flow", () => {
  test.skip(
    !process.env["E2E_TEST_EMAIL"],
    "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run authenticated tests"
  );

  test.beforeEach(async ({ page }) => {
    // Sign in via email+password
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await page.waitForURL(/feed|onboarding/);
  });

  test("signed-in user can access /feed", async ({ page }) => {
    await page.goto("/feed");
    await expect(page).toHaveURL(/feed/);
    await expect(page).not.toHaveURL(/login/);
  });

  test("signed-in user can access profile settings", async ({ page }) => {
    await page.goto("/settings/profile");
    await expect(page).toHaveURL(/settings\/profile/);
  });

  test("sidebar shows navigation links", async ({ page }) => {
    await page.goto("/feed");
    await expect(page.getByRole("link", { name: /feed/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /ideas/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /products/i })).toBeVisible();
  });

  test("sign out redirects to login", async ({ page }) => {
    await page.goto("/feed");
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/login/);
  });
});
