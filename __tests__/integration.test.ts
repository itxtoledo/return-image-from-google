import { createApp, initBrowser } from '../index';
import { Browser, Page } from 'puppeteer';
import { Server } from 'http';
import request from 'supertest';

describe('Image API Integration', () => {
  let server: Server;
  let browser: Browser;
  let page: Page;

  // Increase timeout for integration tests
  jest.setTimeout(30000);

  beforeAll(async () => {
    // Initialize the real browser
    const browserInstance = await initBrowser();
    browser = browserInstance.browser;
    page = browserInstance.page;
    
    // Create the app with real browser
    server = createApp(browser, page);
  });

  afterAll(async () => {
    // Close the server
    await new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
    });
    
    // Close the browser
    if (browser) {
      await browser.close();
    }
  });

  describe('GET /?q=car', () => {
    it('should return a valid JPG image when searching for "car"', async () => {
      const response = await request(server)
        .get('/?q=car')
        .expect(200)
        .expect('Content-Type', 'image/jpeg');

      // Check that we received binary data
      expect(response.body).toBeInstanceOf(Buffer);
      expect(response.body.length).toBeGreaterThan(0);

      // Check JPEG signature (first 2 bytes should be 0xFFD8)
      const firstByte = response.body[0];
      const secondByte = response.body[1];
      expect(firstByte).toBe(0xFF);
      expect(secondByte).toBe(0xD8);
    });
  });
});