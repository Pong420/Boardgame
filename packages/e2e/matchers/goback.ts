import { Page } from 'puppeteer';

export async function goBack(page: Page): Promise<jest.CustomMatcherResult> {
  try {
    const goback = await page.waitForXPath(
      `//button[.//span[@icon="arrow-left"]]`
    );
    await goback.focus();
    await goback.click();
    return {
      message: () => `success`,
      pass: true
    };
  } catch (error) {
    return {
      message: () => error,
      pass: false
    };
  }
}

expect.extend({
  goBack
});
