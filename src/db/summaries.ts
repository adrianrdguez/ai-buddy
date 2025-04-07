import { supabase } from '../config/supabase';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface PageData {
  url: string;
  title: string;
  content: string;
  timeSpent: number;
  scrollDepth: number;
  summary?: string;
  summaryDepth?: 'quick' | 'detailed' | 'comprehensive';
  createdAt?: string;
}

async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });

  return response.data[0].embedding;
}

export async function createSummary(data: PageData) {
  // Generate embedding for the content
  const embedding = await getEmbedding(`${data.title}\n${data.content}`);

  const { data: summary, error } = await supabase
    .from('summaries')
    .insert([
      {
        url: data.url,
        title: data.title,
        content: data.content,
        time_spent: data.timeSpent,
        scroll_depth: data.scrollDepth,
        summary: data.summary,
        created_at: new Date().toISOString(),
        embedding: embedding
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return summary;
}

export async function getSummaries(searchTerm?: string) {
  let query = supabase
    .from('summaries')
    .select('*')
    .order('created_at', { ascending: false });

  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%,url.ilike.%${searchTerm}%`);
  }

  const { data: summaries, error } = await query;

  if (error) throw error;
  return summaries;
} 