'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/auth-helpers-nextjs'
import { createClient, validateShoposEmail } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
        } else if (session) {
          // Validate user has shopos.ai email
          if (session.user.email && validateShoposEmail(session.user.email)) {
            setSession(session)
            setUser(session.user)
          } else {
            // Invalid email domain, sign them out
            await supabase.auth.signOut()
          }
        }
      } catch (error) {
        console.error('Session initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user?.email) {
          // Validate email domain
          if (validateShoposEmail(session.user.email)) {
            setSession(session)
            setUser(session.user)
          } else {
            // Invalid domain, reject the session
            await supabase.auth.signOut()
            setSession(null)
            setUser(null)
          }
        } else {
          setSession(null)
          setUser(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [supabase])

  // Sign in with magic link
  const signInWithEmail = async (email: string) => {
    try {
      // Validate email domain before sending
      if (!validateShoposEmail(email)) {
        return { 
          error: new Error('Access is restricted to @shopos.ai email addresses only') 
        }
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true
        }
      })

      return { error }
    } catch (error) {
      return { 
        error: error instanceof Error ? error : new Error('Authentication failed') 
      }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      } else {
        // Force page reload to clear any cached data
        window.location.href = '/auth/login'
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const value = {
    user,
    session,
    loading,
    signOut,
    signInWithEmail
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}