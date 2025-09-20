// Puppeteer configuration for CI environments
module.exports = {
  // Use the installed Chrome browser
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 
                 '/home/runner/.cache/puppeteer/chrome/linux-140.0.7339.82/chrome-linux64/chrome',
  
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