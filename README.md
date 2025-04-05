# Chrome Buddy

A Chrome extension that helps you build your personal "second brain" by summarizing web pages and providing an intelligent chat interface to interact with your knowledge base.

## Features

- **Web Page Summarization**
  - Automatic summarization of web pages into concise bullet points
  - Stores summaries with metadata (URL, title, time spent, scroll depth)
  - Option to enable/disable auto-summarization

- **Intelligent Chat Interface**
  - Chat with your knowledge base using natural language
  - Get concise, well-structured responses
  - Real-time thinking indicator
  - Clean, formatted output with bullet points

- **Backend Service**
  - REST API with Swagger documentation
  - OpenAI GPT integration for intelligent responses
  - Semantic search for relevant information
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

4. Load the Chrome extension:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `chrome-extension` directory

## Running the Server

Development mode:
```bash
npm run dev
```

The server will start at `http://localhost:3001`

## API Documentation

Access the Swagger UI documentation at:
`http://localhost:3001/api-docs`

### Key Endpoints

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
- `POST /chat`: Chat with your knowledge base
  ```json
  {
    "message": "What do you know about X?"
  }
  ```

## Project Structure

- `src/`
  - `index.ts`: Main Express server setup
  - `summarize.ts`: OpenAI integration and summarization logic
  - `chat.ts`: Chat interface and response generation
  - `swagger.ts`: API documentation
  - `config/`: Configuration files
  - `db/`: Database-related code

- `chrome-extension/`
  - `popup.html`: Extension popup interface
  - `popup.js`: Popup functionality and chat interface
  - `content.js`: Content script for page interaction
  - `background.js`: Background service worker
  - `manifest.json`: Extension configuration

## License

MIT
