import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Server-side Supabase client (for API routes and server components)
export const createServerClient = () => {
  return createRouteHandlerClient({ cookies })
}