import { supabase } from '../config/supabase';

export interface PageData {
  url: string;
  title: string;
  content: string;
  timeSpent?: number;
  scrollDepth?: number;
  summary?: string;
  createdAt?: string;
}

export async function createSummary(data: PageData) {
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
        created_at: new Date().toISOString()
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