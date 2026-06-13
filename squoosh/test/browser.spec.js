import { test, expect } from '@playwright/test';

test.describe('Squoosh Browser Automated Suite', () => {
  test('should pass all codec compressions', async ({ page }) => {
    test.setTimeout(90000); // 90 seconds timeout for this test
    // Navigate to the manual runner HTML
    await page.goto('http://127.0.0.1:8080/squoosh/test/runner.html');

    // Start tests
    await page.click('#runTestsBtn');

    // Wait for the hidden result element to appear
    const resultLocator = page.locator('#testResult');
    await resultLocator.waitFor({ state: 'attached', timeout: 60000 }); // Give it up to 60s to run WASM in browser

    // Extract logs to echo to console
    const logs = await page.locator('#log').innerText();
    console.log('--- Browser Test Logs ---');
    console.log(logs);
    console.log('-------------------------');

    // Check outcome
    const text = await resultLocator.textContent();
    expect(text).toBe('SUCCESS');
  });
});
