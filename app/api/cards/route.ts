import { NextRequest, NextResponse } from 'next/server'
import { getPromptCards, createPromptCard } from '@/lib/database'
import { uploadImage, generateFileName } from '@/lib/storage'

// GET /api/cards - Fetch all cards with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const client = searchParams.get('client') || undefined
    const model = searchParams.get('model') || undefined
    const favorites = searchParams.get('favorites') === 'true'
    const sortBy = (searchParams.get('sortBy') as 'newest' | 'oldest') || 'newest'

    const filters = {
      client: client === 'all' ? undefined : client,
      model: model === 'all' ? undefined : model,
      favorites: favorites || undefined,
      sortBy
    }

    const cards = await getPromptCards(filters)
    return NextResponse.json(cards)
  } catch (error) {
    console.error('Error in GET /api/cards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    )
  }
}

// POST /api/cards - Create new card
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Extract files
    const outputFile = formData.get('outputImage') as File
    const referenceFile = formData.get('referenceImage') as File
    
    if (!outputFile || !referenceFile) {
      return NextResponse.json(
        { error: 'Both output and reference images are required' },
        { status: 400 }
      )
    }

    // Generate unique filenames
    const outputFileName = generateFileName(outputFile.name)
    const referenceFileName = generateFileName(referenceFile.name)

    // Upload images
    const outputPath = await uploadImage(outputFile, 'output', outputFileName)
    const referencePath = await uploadImage(referenceFile, 'reference', referenceFileName)

    // Extract form data
    const cardData = {
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

    // Create database record
    const newCard = await createPromptCard(cardData)
    
    return NextResponse.json(newCard, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/cards:', error)
    return NextResponse.json(
      { error: 'Failed to create card' },
      { status: 500 }
    )
  }
} 