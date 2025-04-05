// src/index.ts
import express, { Request, Response, Express, RequestHandler } from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import { summarizeAndStore } from './summarize';
import { swaggerDocument } from './swagger';

dotenv.config();
const app: Express = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Second Brain API is running!' });
});

const summarizeHandler: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { url, title, content, timeSpent, scrollDepth } = req.body;
  if (!content) {
    res.status(400).json({ error: 'No content provided.' });
    return;
  }

  try {
    const summary = await summarizeAndStore({ url, title, content, timeSpent, scrollDepth });
    res.json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Summarization failed.' });
  }
};

app.post('/summarize', summarizeHandler);

app.listen(PORT, () => {
  console.log(`🧠 Second Brain API running at http://localhost:${PORT}`);
});