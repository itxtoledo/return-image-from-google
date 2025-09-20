# Google Image Search API Project Context

This document provides context about the Google Image Search API project for AI assistants.

## Project Overview

The Google Image Search API is a TypeScript application that scrapes images from Google Images and returns the first result as a JPEG image. It uses Puppeteer for web scraping and Sharp for image processing.

## Key Features

1. **Image Scraping**: Uses Puppeteer to navigate Google Images and extract image URLs
2. **Image Processing**: Converts images to JPEG format using Sharp
3. **API Interface**: Provides a simple HTTP endpoint for image searches
4. **Docker Support**: Containerized for easy deployment

## Technology Stack

- **Language**: TypeScript
- **Runtime**: Node.js v22.11
- **Framework**: Native HTTP module (no Express)
- **Web Scraping**: Puppeteer
- **Image Processing**: Sharp
- **Package Manager**: pnpm
- **Testing**: Jest + Supertest
- **Deployment**: Docker

## How It Works

1. The API receives a search query via the `q` parameter
2. It uses Puppeteer to navigate to Google Images with the search query
3. It clicks on the first image result to open the image viewer
4. It extracts the full-size image URL from the viewer
5. It downloads the image and converts it to JPEG format using Sharp
6. It returns the JPEG image in the response

## Project Structure

```
.
├── index.ts              # Main application code
├── Dockerfile            # Docker configuration
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── README.md             # Project documentation
├── __tests__/            # Test files
│   └── integration.test.ts
└── dist/                 # Compiled JavaScript output
```

## API Endpoint

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

## Development Commands

- `pnpm install` - Install dependencies
- `pnpm build` - Compile TypeScript to JavaScript
- `pnpm start` - Run the compiled application
- `pnpm dev` - Run in development mode with hot reloading
- `pnpm test` - Run all tests
- `pnpm test:integration` - Run integration tests
- `pnpm test:watch` - Run tests in watch mode

## Docker Commands

- `docker build -t image-scraper-api .` - Build the Docker image
- `docker run -d -p 3000:3000 --name image-scraper-api image-scraper-api` - Run the container

## Testing

The project includes integration tests that verify:
1. The API returns a valid JPEG image
2. The response has the correct content type
3. The image data is valid (checks JPEG signature)

## Key Implementation Details

1. **Browser Management**: Uses a single persistent browser instance for efficiency
2. **Error Handling**: Comprehensive error handling with structured logging
3. **Image Selection**: Finds the first non-Google hosted image to avoid Google's own assets
4. **Image Conversion**: All images are converted to JPEG with quality 80 for consistency
5. **Logging**: Structured JSON logging for better observability

## Configuration

The project uses environment variables for configuration:
- `PORT` - Server port (defaults to 3000)

## Common Issues and Solutions

1. **Timeout Issues**: Puppeteer operations have timeouts that may need adjustment for slow connections
2. **Rate Limiting**: Google may rate limit requests; consider adding delays between requests for heavy usage
3. **Captcha Challenges**: Google may present captchas; Puppeteer settings help but don't eliminate this entirely