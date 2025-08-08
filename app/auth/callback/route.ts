import { NextRequest, NextResponse } from 'next/server'
import { validateShoposEmail } from '@/lib/supabase'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createServerClient()
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth_failed`)
      }

      // Validate email domain
      if (data?.user?.email && !validateShoposEmail(data.user.email)) {
        // Sign out the user with invalid domain
        await supabase.auth.signOut()
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=invalid_domain`)
      }

      // Successful authentication with valid domain
      return NextResponse.redirect(`${requestUrl.origin}/`)
      
    } catch (err) {
      console.error('Callback processing error:', err)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=callback_failed`)
    }
  }

  // No code parameter
  return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=no_code`)
}