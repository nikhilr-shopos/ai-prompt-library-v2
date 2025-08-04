import { NextRequest, NextResponse } from 'next/server'
import { updatePromptCard, deletePromptCard, toggleFavorite } from '@/lib/database'
import { uploadImage, deleteImage, generateFileName } from '@/lib/storage'
import { supabase } from '@/lib/supabase'

// PUT /api/cards/[id] - Update card
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData()
    const cardId = params.id

    // Get current card data to compare images
    const { data: currentCard } = await supabase
      .from('prompt_cards')
      .select('*')
      .eq('id', cardId)
      .single()

    if (!currentCard) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      )
    }

    let outputPath = currentCard.output_image_path
    let referencePath = currentCard.reference_image_path

    // Handle output image replacement
    const newOutputFile = formData.get('outputImage') as File | null
    const deleteOutputImage = formData.get('deleteOutputImage') === 'true'
    
    if (deleteOutputImage && newOutputFile) {
      // Delete old image and upload new one
      await deleteImage(currentCard.output_image_path)
      const outputFileName = generateFileName(newOutputFile.name)
      outputPath = await uploadImage(newOutputFile, 'output', outputFileName)
    }

    // Handle reference image replacement
    const newReferenceFile = formData.get('referenceImage') as File | null
    const deleteReferenceImage = formData.get('deleteReferenceImage') === 'true'
    
    if (deleteReferenceImage && newReferenceFile) {
      // Delete old image and upload new one
      await deleteImage(currentCard.reference_image_path)
      const referenceFileName = generateFileName(newReferenceFile.name)
      referencePath = await uploadImage(newReferenceFile, 'reference', referenceFileName)
    }

    // Prepare update data
    const updateData = {
      output_image_path: outputPath,
      reference_image_path: referencePath,
      prompt: formData.get('prompt') as string,
      metadata: formData.get('metadata') as string,
      client: formData.get('client') as string,
      model: formData.get('model') as string,
      llm_used: formData.get('llmUsed') as string || undefined,
      seed: formData.get('seed') as string,
      notes: formData.get('notes') as string || undefined,
      is_favorited: formData.get('isFavorited') === 'true'
    }

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

// DELETE /api/cards/[id] - Delete card
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cardId = params.id

    // Get card data to delete associated images
    const { data: card } = await supabase
      .from('prompt_cards')
      .select('output_image_path, reference_image_path')
      .eq('id', cardId)
      .single()

    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      )
    }

    // Delete images from storage
    await Promise.all([
      deleteImage(card.output_image_path),
      deleteImage(card.reference_image_path)
    ])

    // Delete database record
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