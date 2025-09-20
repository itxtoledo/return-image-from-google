# Google Image Search API

This is a simple API that searches for images on Google Images using Puppeteer and returns the first result as a JPEG image.

## How It Works

1. The API receives a search query via the `q` parameter
2. It uses Puppeteer to navigate to Google Images with the search query
3. It clicks on the first image result to open the image viewer
4. It extracts the full-size image URL from the viewer
5. It downloads the image and converts it to JPEG format using Sharp
6. It returns the JPEG image in the response

## Endpoints

### GET /

Search for images on Google Images and return the first result as a JPEG.

**Query Parameters:**
- `q` (required): The search query

**Example:**
```
GET /?q=cats
```

**Response:**
Returns a JPEG image or an error message if no images are found.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Build the project:
   ```bash
   pnpm build
   ```

3. Run the server:
   ```bash
   pnpm start
   ```

   Or for development:
   ```bash
   pnpm dev
   ```

4. Test the API:
   ```bash
   curl "http://localhost:3000?q=cats" --output image.jpg
   ```

## Testing

To run all tests locally:

```bash
pnpm test
```

To run integration tests specifically:

```bash
pnpm test:integration
```

To run tests in watch mode:

```bash
pnpm test:watch
```

## Docker

1. Build the Docker image:
   ```
   docker build -t image-scraper-api .
   ```

2. Run the Docker container:
   ```
   docker run -d -p 3000:3000 --name image-scraper-api image-scraper-api
   ```

3. Test the API:
   ```
   curl "http://localhost:3000?q=cats" --output image.jpg
   ```
