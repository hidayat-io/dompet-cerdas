import { expect, test } from '@playwright/test';

test.describe('Plan item persistence', () => {
  test('creates a plan item and keeps it after reload', async ({ page }) => {
    const planTitle = `E2E Plan ${Date.now()}`;
    const itemTitle = `E2E Item ${Date.now()}`;

    await page.goto('/');

    await page.getByTestId('auth-e2e-login').click();
    await expect(page.getByTestId('onboarding-close')).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('onboarding-close').click();

    await page.getByTestId('nav-plans').click();
    await page.getByTestId('plans-open-create-dialog').click();
    await page.getByTestId('plans-create-title').fill(planTitle);
    await page.getByTestId('plans-create-submit').click();

    await expect(page.getByText(planTitle)).toBeVisible({ timeout: 20_000 });
    await page.locator('[data-testid^="plan-open-"]').first().click();

    await page.getByTestId('plans-open-add-item').click();
    await page.getByTestId('plans-item-name').fill(itemTitle);
    await page.getByTestId('plans-item-amount').fill('250000');
    await page.getByTestId('plans-item-submit').click();

    await expect(page.getByText(itemTitle)).toBeVisible({ timeout: 20_000 });

    await page.reload();
    await expect(page.getByRole('button', { name: 'Rencana' })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Rencana' }).click();
    await expect(page.getByText(planTitle)).toBeVisible({ timeout: 20_000 });
    await page.getByText(planTitle).click();
    await expect(page.getByText(itemTitle)).toBeVisible({ timeout: 20_000 });
  });
});
