import { NextResponse } from 'next/server'
import { getFilterOptions } from '@/lib/database'

export async function GET() {
  try {
    // FIXED: Pass isServer=true to use server-side Supabase client
    const options = await getFilterOptions()
    
    return NextResponse.json(options)
  } catch (error) {
    console.error('Error in GET /api/filter-options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    )
  }
}