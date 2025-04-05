import OpenAI from 'openai';
import { supabase } from './config/supabase';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function chatWithBrain(message: string): Promise<string> {
  try {
    // First, try to get any summaries to verify database connection
    const { data: testData, error: testError } = await supabase
      .from('summaries')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('Database connection error:', testError);
      return "I'm having trouble connecting to the database. Please check if the server is running.";
    }

    if (!testData || testData.length === 0) {
      return "I don't have any information in my knowledge base yet. Try summarizing a page first!";
    }

    // Get embedding for the query
    const queryEmbedding = await getEmbedding(message);

    // Try semantic search
    let summaries;
    const { data: semanticSummaries, error: searchError } = await supabase
      .rpc('match_summaries', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5, // Lower threshold to get more matches
        match_count: 5
      });

    if (searchError) {
      console.error('Search error:', searchError);
      // Fallback to simple text search
      const { data: fallbackSummaries, error: fallbackError } = await supabase
        .from('summaries')
        .select('*')
        .or(`title.ilike.%${message}%,summary.ilike.%${message}%`)
        .limit(5);

      if (fallbackError) {
        console.error('Fallback search error:', fallbackError);
        return "I'm having trouble searching my knowledge base. Please try again later.";
      }

      if (!fallbackSummaries || fallbackSummaries.length === 0) {
        return "I couldn't find any information about that in my knowledge base. Try summarizing a page about it first!";
      }

      summaries = fallbackSummaries;
    } else {
      summaries = semanticSummaries;
    }

    // Create a prompt with the relevant context
    const context = summaries
      .map((summary: any) => `Title: ${summary.title}\nSummary: ${summary.summary}\nURL: ${summary.url}`)
      .join('\n\n');

    const prompt = `Based on the following context from my knowledge base, please answer the question. If the answer isn't in the context, say so.\n\nContext:\n${context}\n\nQuestion: ${message}\n\nAnswer:`;

    // Generate response using OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-1106',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return response.choices[0].message?.content || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error('Chat error:', error);
    return "I encountered an error while processing your question. Please try again.";
  }
}

async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding error:', error);
    throw error;
  }
} 