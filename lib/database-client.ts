import { PromptCard, NewPromptCard } from './supabase';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/** ---------- Client-Side Database Functions ---------- */
export async function getPromptCardsByIds(cardIds: string[]): Promise<PromptCard[]> {
  const supabase = createClientComponentClient();

  const { data, error } = await supabase
    .from('prompt_cards')
    .select('*')
    .in('id', cardIds);

  if (error) {
    console.error('🔴 getPromptCardsByIds error:', error);
    throw new Error('Failed to fetch prompt cards by IDs');
  }

  return data as PromptCard[];
} 