import { PromptCard, NewPromptCard } from './supabase';
import { createServerClient } from './supabase-server';

/** ---------- Helper ---------- */
function getSupabase() {
  return createServerClient();
}

/** ---------- Types ---------- */
export interface PaginatedResult {
  cards: PromptCard[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** ---------- READ (SELECT) ---------- */
export async function getPromptCards(filters?: {
  client?: string;
  model?: string;
  favorites?: boolean;
  sortBy?: 'newest' | 'oldest';
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult> {
  const supabase = getSupabase();

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 50;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('prompt_cards')
    .select('*', { count: 'exact' });

  // ----- filters -------------------------------------------------
  if (filters?.client && filters.client !== 'all') {
    query = query.eq('client', filters.client);
  }
  if (filters?.model && filters.model !== 'all') {
    query = query.eq('model', filters.model);
  }
  if (filters?.favorites) {
    query = query.eq('is_favorited', true);
  }

  // ----- sorting -------------------------------------------------
  const asc = filters?.sortBy === 'oldest';
  query = query.order('created_at', { ascending: asc });

  // ----- pagination ----------------------------------------------
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('🔴 getPromptCards error:', error);
    throw new Error('Failed to fetch prompt cards');
  }

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    cards: data as PromptCard[],
    totalCount,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export async function getPromptCardsByIds(cardIds: string[]): Promise<PromptCard[]> {
  const supabase = getSupabase();

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

/** ---------- CREATE (INSERT) ---------- */
export async function createPromptCard(card: NewPromptCard): Promise<PromptCard> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('prompt_cards')
    .insert(card)
    .select()
    .single();

  if (error) {
    console.error('🔴 createPromptCard error:', error);
    throw new Error('Failed to create prompt card');
  }

  return data as PromptCard;
}

/** ---------- UPDATE ---------- */
export async function updatePromptCard(id: string, updates: Partial<PromptCard>): Promise<PromptCard> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('prompt_cards')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('🔴 updatePromptCard error:', error);
    throw new Error('Failed to update prompt card');
  }

  return data as PromptCard;
}

/** ---------- DELETE ---------- */
export async function deletePromptCard(id: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('prompt_cards')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('🔴 deletePromptCard error:', error);
    throw new Error('Failed to delete prompt card');
  }
}

/** ---------- TOGGLE FAVORITE ---------- */
export async function toggleFavorite(id: string, isFavorited: boolean): Promise<PromptCard> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('prompt_cards')
    .update({ is_favorited: isFavorited })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('🔴 toggleFavorite error:', error);
    throw new Error('Failed to toggle favorite');
  }

  return data as PromptCard;
}

/** ---------- GET FILTER OPTIONS ---------- */
export async function getFilterOptions() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('prompt_cards')
    .select('client, model');

  if (error) {
    console.error('🔴 getFilterOptions error:', error);
    return { clients: [], models: [] };
  }

  const clients = [...new Set(data.map((i: any) => i.client))].sort();
  const models = [...new Set(data.map((i: any) => i.model))].sort();

  return { clients, models };
}