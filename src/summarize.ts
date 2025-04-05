// src/summarize.ts
import OpenAI from 'openai';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PageData {
  url: string;
  title: string;
  content: string;
  timeSpent?: number;
  scrollDepth?: number;
}

export async function summarizeAndStore(data: PageData): Promise<string> {
  const prompt = `Summarize this web page in 5 bullet points:\n\nTitle: ${data.title}\n\nContent:\n${data.content}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-1106',
    messages: [{ role: 'user', content: prompt }],
  });

  const summary = response.choices[0].message?.content || 'No summary generated.';

  // Save to local JSON file (mock "second brain")
  const filePath = path.resolve(__dirname, '../brain.json');
  let saved = [];

  try {
    const existing = await fs.readFile(filePath, 'utf-8');
    saved = JSON.parse(existing);
  } catch (_) {}

  saved.push({ ...data, summary, createdAt: new Date().toISOString() });
  await fs.writeFile(filePath, JSON.stringify(saved, null, 2));

  return summary;
}