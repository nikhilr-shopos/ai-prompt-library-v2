import { NextResponse } from 'next/server'
import { getFilterOptions } from '@/lib/database'

// GET /api/filter-options - Get unique clients and models
export async function GET() {
  try {
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