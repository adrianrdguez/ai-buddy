# Second Brain API

A backend service that summarizes web pages and stores them in your personal "second brain" using OpenAI's GPT models.

## Features

- Summarize web page content into bullet points
- Store summaries with metadata (URL, title, time spent, scroll depth)
- REST API with Swagger documentation
- Local JSON storage (mock "second brain")

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

## Running the Server

Development mode:
```bash
npm run dev
```

The server will start at `http://localhost:3001`

## API Documentation

Access the Swagger UI documentation at:
`http://localhost:3001/api-docs`

### Endpoints

- `GET /`: Health check endpoint
- `POST /summarize`: Summarize web page content
  ```json
  {
    "url": "https://example.com",
    "title": "Example Article",
    "content": "Article content to summarize...",
    "timeSpent": 120,
    "scrollDepth": 0.8
  }
  ```

## Project Structure

- `src/index.ts`: Main Express server setup
- `src/summarize.ts`: OpenAI integration and summarization logic
- `src/swagger.ts`: API documentation
- `brain.json`: Local storage for summaries (created automatically)

## License

MIT
