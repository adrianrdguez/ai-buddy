// src/summarize.ts
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { PageData, createSummary, getSummaries } from './db/summaries';

// Load environment variables
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function summarizeAndStore(data: PageData): Promise<string> {
  const prompt = `Summarize this web page in 5 bullet points:\n\nTitle: ${data.title}\n\nContent:\n${data.content}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-1106',
    messages: [{ role: 'user', content: prompt }],
  });

  const summary = response.choices[0].message?.content || 'No summary generated.';

  // Save to Supabase
  await createSummary({ ...data, summary });

  return summary;
}

export { getSummaries };