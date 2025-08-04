import { createClient } from '@supabase/supabase-js'

// Types for our database
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

// Create Supabase client with hardcoded values (bypasses env var issues)
const supabaseUrl = 'https://berxjwobcncmoivnezge.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlcnhqd29iY25jbW9pdm5lemdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0ODgxMDIsImV4cCI6MjA2ODA2NDEwMn0.uSKXDUrVH2l4SesUD3X9H7gz7_-pC5mxxAjgY3IQEdc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)