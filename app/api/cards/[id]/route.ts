import { NextRequest, NextResponse } from 'next/server'
import { updatePromptCard, deletePromptCard } from '@/lib/database'
import { deleteImage } from '@/lib/storage'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const cardId = params.id

    // Build update data
    const updateData: any = {}
    if (body.prompt !== undefined) updateData.prompt = body.prompt
    if (body.metadata !== undefined) updateData.metadata = body.metadata
    if (body.client !== undefined) updateData.client = body.client
    if (body.model !== undefined) updateData.model = body.model
    if (body.seed !== undefined) updateData.seed = body.seed
    if (body.llm_used !== undefined) updateData.llm_used = body.llm_used
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.output_image_path !== undefined) updateData.output_image_path = body.output_image_path
    if (body.reference_image_path !== undefined) updateData.reference_image_path = body.reference_image_path
    if (body.is_favorited !== undefined) updateData.is_favorited = body.is_favorited

    // FIXED: Pass isServer=true to use server-side Supabase client
    const updatedCard = await updatePromptCard(cardId, updateData)
    
    return NextResponse.json(updatedCard)
  } catch (error) {
    console.error('Error in PUT /api/cards/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to update card' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cardId = params.id

    // Get card data first to retrieve image paths
    // Note: We'll need to modify this if we want to delete images
    // For now, just delete the database record

    // FIXED: Pass isServer=true to use server-side Supabase client
    await deletePromptCard(cardId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/cards/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to delete card' },
      { status: 500 }
    )
  }
}