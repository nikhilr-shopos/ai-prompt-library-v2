import { supabase } from './supabase'

export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('prompt_cards')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Connection test failed:', error)
      return false
    }

    console.log('✅ Database connection successful')
    return true
  } catch (err) {
    console.error('❌ Database connection failed:', err)
    return false
  }
} 