import { NextRequest, NextResponse } from 'next/server'
import { toggleFavorite } from '@/lib/database'

// PATCH /api/cards/[id]/favorite - Toggle favorite status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isFavorited } = await request.json()
    const cardId = params.id

    const updatedCard = await toggleFavorite(cardId, isFavorited)
    return NextResponse.json(updatedCard)
  } catch (error) {
    console.error('Error in PATCH /api/cards/[id]/favorite:', error)
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    )
  }
} 