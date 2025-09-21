// Puppeteer configuration for CI environments
module.exports = {
  // Use the installed Chrome browser
  // If PUPPETEER_EXECUTABLE_PATH is set, use it, otherwise let Puppeteer find the browser automatically
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  
  // Default launch options
  launchOptions: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  }
};