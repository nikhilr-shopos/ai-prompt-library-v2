import { NextRequest, NextResponse } from 'next/server'
import { getPromptCards, createPromptCard } from '@/lib/database'
import { NewPromptCard } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      client: searchParams.get('client') || undefined,
      model: searchParams.get('model') || undefined,
      favorites: searchParams.get('favorites') === 'true',
      sortBy: (searchParams.get('sortBy') as 'newest' | 'oldest') || 'newest',
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '50')
    }

    // FIXED: Pass isServer=true to use server-side Supabase client
    const result = await getPromptCards(filters)
    
    return NextResponse.json({
      cards: result.cards,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalCount: result.totalCount,
        pageSize: filters.pageSize,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage
      }
    })
  } catch (error) {
    console.error('Error in GET /api/cards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newCard: NewPromptCard = {
      prompt: body.prompt,
      metadata: body.metadata,
      client: body.client,
      model: body.model,
      seed: body.seed,
      llm_used: body.llm_used || null,
      notes: body.notes || null,
      output_image_path: body.output_image_path,
      reference_image_path: body.reference_image_path,
      is_favorited: false
    }

    // FIXED: Pass isServer=true to use server-side Supabase client
    const card = await createPromptCard(newCard)
    
    return NextResponse.json(card, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/cards:', error)
    return NextResponse.json(
      { error: 'Failed to create card' },
      { status: 500 }
    )
  }
}