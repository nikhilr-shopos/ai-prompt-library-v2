import { supabase, PromptCard, NewPromptCard } from './supabase'

// Get all prompt cards with optional filtering
export async function getPromptCards(filters?: {
  client?: string
  model?: string
  favorites?: boolean
  sortBy?: 'newest' | 'oldest'
}) {
  let query = supabase
    .from('prompt_cards')
    .select('*')

  // Apply filters
  if (filters?.client && filters.client !== 'all') {
    query = query.eq('client', filters.client)
  }
  
  if (filters?.model && filters.model !== 'all') {
    query = query.eq('model', filters.model)
  }
  
  if (filters?.favorites) {
    query = query.eq('is_favorited', true)
  }

  // Apply sorting
  const sortDirection = filters?.sortBy === 'oldest' ? 'asc' : 'desc'
  query = query.order('created_at', { ascending: sortDirection === 'asc' })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching prompt cards:', error)
    throw new Error('Failed to fetch prompt cards')
  }

  return data as PromptCard[]
}

// Get unique clients and models for filter dropdowns
export async function getFilterOptions() {
  const { data, error } = await supabase
    .from('prompt_cards')
    .select('client, model')

  if (error) {
    console.error('Error fetching filter options:', error)
    return { clients: [], models: [] }
  }

  const clients = [...new Set(data.map(item => item.client))].sort()
  const models = [...new Set(data.map(item => item.model))].sort()

  return { clients, models }
}

// Create new prompt card
export async function createPromptCard(card: NewPromptCard) {
  const { data, error } = await supabase
    .from('prompt_cards')
    .insert([card])
    .select()
    .single()

  if (error) {
    console.error('Error creating prompt card:', error)
    throw new Error('Failed to create prompt card')
  }

  return data as PromptCard
}

// Update prompt card
export async function updatePromptCard(id: string, updates: Partial<NewPromptCard>) {
  const { data, error } = await supabase
    .from('prompt_cards')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating prompt card:', error)
    throw new Error('Failed to update prompt card')
  }

  return data as PromptCard
}

// Delete prompt card
export async function deletePromptCard(id: string) {
  const { error } = await supabase
    .from('prompt_cards')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting prompt card:', error)
    throw new Error('Failed to delete prompt card')
  }
}

// Toggle favorite status
export async function toggleFavorite(id: string, isFavorited: boolean) {
  const { data, error } = await supabase
    .from('prompt_cards')
    .update({ is_favorited: isFavorited })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error toggling favorite:', error)
    throw new Error('Failed to toggle favorite')
  }

  return data as PromptCard
} 