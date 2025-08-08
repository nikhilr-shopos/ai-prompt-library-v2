import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Keep your existing database types
export interface PromptCard {
  id: string
  output_image_path: string
  reference_image_path: string
  prompt: string
  metadata: string
  client: string
  model: string
  llm_used?: string
  seed: string
  notes?: string
  is_favorited: boolean
  created_at: string
  outputImageUrl?: string
  referenceImageUrl?: string
}

export interface NewPromptCard {
  output_image_path: string
  reference_image_path: string
  prompt: string
  metadata: string
  client: string
  model: string
  llm_used?: string
  seed: string
  notes?: string
  is_favorited?: boolean
}

// Add new auth-related types
export interface AuthUser {
  id: string
  email: string
  email_confirmed_at: string | null
  created_at: string
  user_metadata?: {
    [key: string]: any
  }
}

// ✅ SECURE: Use environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validation to ensure environment variables exist
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Client-side Supabase client (for React components)
export const createClient = () => {
  return createClientComponentClient()
}

// Email domain validation for @shopos.ai
export const validateShoposEmail = (email: string): boolean => {
  return email.toLowerCase().endsWith('@shopos.ai')
}

// Keep your existing supabase client for backward compatibility
// This ensures all your existing code continues to work
export const supabase = createClient(supabaseUrl, supabaseAnonKey)