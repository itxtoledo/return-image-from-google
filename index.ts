import puppeteer, { Browser, Page } from "puppeteer";
import { createServer, type IncomingMessage, type ServerResponse } from "http";
import sharp from "sharp";

// Utility function for structured logging
function log(message: string, level: "INFO" | "WARN" | "ERROR" = "INFO", meta?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    meta
  };
  console.log(JSON.stringify(logEntry));
}

export function buildGoogleImageSearchUrl(
  query: string,
  options?: {
    filetypes?: string[]; // ["jpg", "png", "gif", "svg"...]
    size?: "m" | "l" | "xl"; // medium, large, extra-large
    aspect?: "w" | "t" | "s" | "h"; // wide, tall, square, high
    color?: "color" | "gray" | "trans"; // colorido, p&b, transparente
  }
): string {
  const baseUrl = "https://www.google.com/search";

  // Monta parte da query com OR entre formatos
  let queryStr = query;
  if (options?.filetypes?.length) {
    const filetypeQuery = options.filetypes
      .map((ft) => `filetype:${ft}`)
      .join("|");
    queryStr += ` (${filetypeQuery})`;
  }

  const params = new URLSearchParams({
    q: queryStr,
    tbm: "isch", // busca imagens
  });

  if (options?.size) params.set("imgsz", options.size);
  if (options?.aspect) params.set("imgar", options.aspect);
  if (options?.color) params.set("imgc", options.color);

  return `${baseUrl}?${params.toString()}`;
}

// Initialize browser and page
export async function initBrowser(): Promise<{ browser: Browser; page: Page }> {
  log("Launching browser...", "INFO");
  const browser = await puppeteer.launch({
    headless: true, // mudar para false para ver o browser
    // slowMo: 100, // adiciona delay entre as ações
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  
  log("Creating new page...", "INFO");
  const page = await browser.newPage();

  // Definir um tamanho de tela adequado
  await page.setViewport({
    width: 1280,
    height: 800,
  });

  log("Navigating to Google homepage...", "INFO");
  await page.goto("https://www.google.com", {
    waitUntil: "networkidle2",
  });
  
  log("Browser successfully initialized and ready", "INFO");
  return { browser, page };
}

export async function getNonGoogleImageUrl(page: Page): Promise<string | null> {
  try {
    log("Waiting for image viewer to load...", "INFO");
    await page.waitForSelector(
      'c-wiz[jsdata="deferred-vfe_uviewer_2"]',
      {
        visible: true,
        timeout: 5000, // 5 seconds timeout for the viewer to appear
      }
    );

    const imageData = await page.evaluate(() => {
      const viewer = document.querySelector(
        'c-wiz[jsdata="deferred-vfe_uviewer_2"]'
      );
      if (!viewer) return null;

      const googleStaticDomains = [
        "gstatic.com",
        "google.com",
        "googleapis.com",
      ];

      const allImages = Array.from(viewer.querySelectorAll("img"));

      const firstNonGoogleImage = allImages.find(img => {
        try {
          const url = new URL(img.src);
          return !googleStaticDomains.some(domain => url.hostname.endsWith(domain));
        } catch (e) {
          return true;
        }
      });

      return {
        src: firstNonGoogleImage?.src,
      };
    });

    if (imageData?.src) {
      log("Found non-Google image URL", "INFO", { url: imageData.src });
    } else {
      log("No non-Google image found", "WARN");
    }

    return imageData?.src || null;
  } catch (error) {
    log("Failed to find viewer or non-Google image", "ERROR", { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

export async function processRequest(req: IncomingMessage, res: ServerResponse, browser: Browser, page: Page) {
  // Parse the URL
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // Only handle GET requests to the root path
  if (url.pathname === "/" && req.method === "GET") {
    const query = url.searchParams.get("q");

    if (!query) {
      log("Missing query parameter", "WARN", { clientIP, path: url.pathname });
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing query parameter 'q'" }));
      return;
    }

    log("Processing image search request", "INFO", { clientIP, query });
    
    try {
      // Reuse the global page
      const searchUrl = buildGoogleImageSearchUrl(query, {
        size: "l",
        aspect: "w",
        color: "color",
      });
      
      log("Navigating to Google Images search", "INFO", { searchUrl });
      await page.goto(searchUrl, { waitUntil: "networkidle2" });

      // Wait for images to load
      log("Waiting for images to load...", "INFO");
      await page.waitForSelector("img", { timeout: 10000 });

      // Organize the logic to get alt text before clicking
      try {
        // Wait for the first thumbnail to ensure the page is ready
        log("Waiting for image thumbnails...", "INFO");
        await page.waitForSelector("div[data-lpage]", { timeout: 5000 });

        // Click on the first thumbnail to open the image viewer
        log("Clicking on first image thumbnail...", "INFO");
        await page.click("div[data-lpage]");

        let nonGoogleImageUrl: string | null = null;
        for (let i = 0; i < 4; i++) {
          nonGoogleImageUrl = await getNonGoogleImageUrl(page);
          if (nonGoogleImageUrl) {
            break;
          }
          log(`Attempt ${i + 1} failed. Retrying...`, "WARN");
          // Optional: wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (nonGoogleImageUrl) {
          try {
            log("Downloading image from source...", "INFO", { url: nonGoogleImageUrl });
            
            // Use Node's fetch API to download the image
            const imageResponse = await fetch(nonGoogleImageUrl);
            
            if (imageResponse.ok) {
              const arrayBuffer = await imageResponse.arrayBuffer();
              const imageBuffer = Buffer.from(arrayBuffer);
              const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

              // Convert image to JPG using sharp
              log("Converting image to JPG format...", "INFO");
              const jpgBuffer = await sharp(imageBuffer)
                .jpeg({ quality: 80, progressive: true })
                .toBuffer();
              
              // Return the converted image
              log("Image successfully converted to JPG and sent to client", "INFO", { 
                clientIP, 
                size: jpgBuffer.length 
              });
              
              res.writeHead(200, {
                "Content-Type": "image/jpeg",
                "Content-Length": jpgBuffer.length,
              });
              res.end(jpgBuffer);
            } else {
              throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
            }
          } catch (downloadError: any) {
            log("Failed to download image", "ERROR", { 
              clientIP, 
              error: downloadError instanceof Error ? downloadError.message : String(downloadError) 
            });
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: "Failed to download image",
                message: downloadError.message,
              })
            );
          }
        } else {
          log("No full-size image found", "WARN", { clientIP, query });
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "No full-size image found" }));
        }
      } catch (clickError: any) {
        log("Failed to click on image or load viewer", "ERROR", { 
          clientIP, 
          error: clickError instanceof Error ? clickError.message : String(clickError) 
        });
        throw clickError;
      }
    } catch (error: any) {
      log("Error during image fetching process", "ERROR", { 
        clientIP, 
        error: error instanceof Error ? error.message : String(error) 
      });
      // Don't navigate away on error, so the user can inspect the page.
      // await page.goto("https://www.google.com", {
      //   waitUntil: "networkidle2",
      // });

      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Failed to fetch images",
          message: error.message,
        })
      );
    }
  } else {
    log("Route not found", "WARN", { clientIP, path: url.pathname, method: req.method });
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }
}

// Create server function for testing
export function createApp(browser: Browser, page: Page) {
  return createServer(async (req, res) => {
    await processRequest(req, res, browser, page);
  });
}

async function main() {
  log("Starting application...", "INFO");
  
  try {
    // Initialize the browser and page
    const { browser, page } = await initBrowser();

    const PORT = process.env.PORT || 3000;

    // Define the server
    const server = createApp(browser, page);

    // Start the server
    server.listen(PORT, () => {
      log(`Server successfully started`, "INFO", { port: PORT, url: `http://localhost:${PORT}` });
    });

    // Handle graceful shutdown
    const shutdown = async () => {
      log("Received shutdown signal, closing browser...", "INFO");
      await browser.close();
      log("Browser closed successfully", "INFO");
      process.exit(0);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
    
  } catch (error) {
    log("Failed to start application", "ERROR", { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  main().catch(error => {
    console.error("Unhandled error in main:", error);
    process.exit(1);
  });
}