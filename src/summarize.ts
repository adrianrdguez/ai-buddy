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
  // Determine summary depth based on engagement metrics
  const summaryDepth = determineSummaryDepth(data);
  
  let prompt = '';
  if (summaryDepth === 'quick') {
    prompt = `Provide a quick 3-point summary of this web page:\n\nTitle: ${data.title}\n\nContent:\n${data.content}`;
  } else if (summaryDepth === 'detailed') {
    prompt = `Summarize this web page in 5 bullet points, focusing on key insights and important details:\n\nTitle: ${data.title}\n\nContent:\n${data.content}`;
  } else {
    prompt = `Provide a comprehensive 7-point summary of this web page, including supporting details and examples:\n\nTitle: ${data.title}\n\nContent:\n${data.content}`;
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-1106',
    messages: [{ role: 'user', content: prompt }],
  });

  const summary = response.choices[0].message?.content || 'No summary generated.';

  // Save to Supabase
  await createSummary({ ...data, summary, summaryDepth });

  return summary;
}

function determineSummaryDepth(data: PageData): 'quick' | 'detailed' | 'comprehensive' {
  // Quick summary if:
  // - Less than 1 minute spent
  // - Low scroll depth
  if (data.timeSpent < 60 || data.scrollDepth < 0.3) {
    return 'quick';
  }
  
  // Comprehensive summary if:
  // - More than 5 minutes spent
  // - High scroll depth
  // - Multiple content changes
  if (data.timeSpent > 300 || data.scrollDepth > 0.8) {
    return 'comprehensive';
  }
  
  // Default to detailed summary
  return 'detailed';
}

export { getSummaries };