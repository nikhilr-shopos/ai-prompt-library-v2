import { supabase } from './supabase'
import type { NewPromptCard } from './supabase'

// File validation
export function validateFile(file: File, maxSizeMB: number = 50): void {
  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    throw new Error('Please upload PNG, JPG, GIF, or WebP files only')
  }

  // Validate file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    throw new Error(`File size must be less than ${maxSizeMB}MB`)
  }

  // Validate file exists and has content
  if (file.size === 0) {
    throw new Error('File appears to be empty')
  }
}

// Generate unique filename with better collision prevention
export function generateFileName(originalName: string): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  return `${timestamp}-${randomId}.${extension}`
}

// Direct upload to Supabase Storage
export async function uploadImageDirect(
  file: File,
  folder: 'Output' | 'Reference'
): Promise<string> {
  // Validate file first
  validateFile(file)
  
  const fileName = generateFileName(file.name)
  const filePath = `${folder}/${fileName}`
  
  const { data, error } = await supabase.storage
    .from('prompt-library')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('❌ Upload error:', error)
    throw new Error(`Failed to upload ${folder} image: ${error.message}`)
  }
  
  return data.path
}

// Direct database operations
export async function createPromptCardDirect(cardData: {
  output_image_path: string
  reference_image_path: string
  prompt: string
  metadata: string
  client: string
  model: string
  llm_used?: string
  seed: string
  notes?: string
  is_favorited?: boolean
}): Promise<string> {
  const { data, error } = await supabase
    .from('prompt_cards')
    .insert([cardData])
    .select('id, output_image_path, reference_image_path')
    .single()

  if (error) {
    console.error('❌ Database insert error:', error)
    throw new Error(`Failed to create prompt card: ${error.message}`)
  }

  return data.id
}

// Complete direct upload flow with error recovery
export async function uploadPromptCardComplete(formData: {
  outputImage: File
  referenceImage: File
  prompt: string
  metadata: string
  client: string
  model: string
  llmUsed?: string
  seed: string
  notes?: string
  is_favorited?: boolean
}): Promise<string> {
  let outputImagePath: string | null = null
  let referenceImagePath: string | null = null

  try {
    // Upload output image
    outputImagePath = await uploadImageDirect(formData.outputImage, 'Output')
    
    // Upload reference image
    referenceImagePath = await uploadImageDirect(formData.referenceImage, 'Reference')

    // Create database record
    const cardId = await createPromptCardDirect({
      output_image_path: outputImagePath,
      reference_image_path: referenceImagePath,
      prompt: formData.prompt,
      metadata: formData.metadata,
      client: formData.client,
      model: formData.model,
      llm_used: formData.llmUsed || undefined,
      seed: formData.seed,
      notes: formData.notes || undefined,
      is_favorited: formData.is_favorited || false
    })

    return cardId

  } catch (error) {
    console.error('Upload failed, cleaning up...', error)
    
    // Cleanup uploaded files if database save failed
    const cleanupPromises: Promise<void>[] = []
    
    if (outputImagePath) {
      cleanupPromises.push(deleteImage(outputImagePath).catch(console.error))
    }
    
    if (referenceImagePath) {
      cleanupPromises.push(deleteImage(referenceImagePath).catch(console.error))
    }

    // Wait for cleanup (don't throw cleanup errors)
    await Promise.all(cleanupPromises)

    // Re-throw original error
    throw error
  }
}

// Update existing prompt card with new images
export async function updatePromptCardComplete(
  cardId: string,
  formData: {
    outputImage?: File
    referenceImage?: File
    prompt: string
    metadata: string
    client: string
    model: string
    llmUsed?: string
    seed: string
    notes?: string
  },
  currentPaths?: {
    output_image_path?: string
    reference_image_path?: string
  }
): Promise<void> {
  let newOutputPath: string | null = null
  let newReferencePath: string | null = null
  const oldPaths: string[] = []

  try {
    // Upload new output image if provided
    if (formData.outputImage) {
      newOutputPath = await uploadImageDirect(formData.outputImage, 'Output')
      if (currentPaths?.output_image_path) {
        oldPaths.push(currentPaths.output_image_path)
      }
    }

    // Upload new reference image if provided
    if (formData.referenceImage) {
      newReferencePath = await uploadImageDirect(formData.referenceImage, 'Reference')
      if (currentPaths?.reference_image_path) {
        oldPaths.push(currentPaths.reference_image_path)
      }
    }

    // Update database record
    const updateData: any = {
      prompt: formData.prompt,
      metadata: formData.metadata,
      client: formData.client,
      model: formData.model,
      llm_used: formData.llmUsed || undefined,
      seed: formData.seed,
      notes: formData.notes || undefined
    }

    if (newOutputPath) updateData.output_image_path = newOutputPath
    if (newReferencePath) updateData.reference_image_path = newReferencePath

    const { error } = await supabase
      .from('prompt_cards')
      .update(updateData)
      .eq('id', cardId)

    if (error) {
      throw new Error(`Failed to update prompt card: ${error.message}`)
    }

    // Clean up old images after successful update
    if (oldPaths.length > 0) {
      await Promise.all(oldPaths.map(path => deleteImage(path).catch(console.error)))
    }

  } catch (error) {
    console.error('Update failed, cleaning up new uploads...', error)
    
    // Cleanup new uploads if database update failed
    const cleanupPromises: Promise<void>[] = []
    
    if (newOutputPath) {
      cleanupPromises.push(deleteImage(newOutputPath).catch(console.error))
    }
    
    if (newReferencePath) {
      cleanupPromises.push(deleteImage(newReferencePath).catch(console.error))
    }

    await Promise.all(cleanupPromises)
    throw error
  }
}

// Delete image from Supabase Storage
export async function deleteImage(imagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('prompt-library')
    .remove([imagePath])

  if (error) {
    console.error('Error deleting image:', error)
    throw new Error('Failed to delete image')
  }
}

// Get signed URL for image display
export async function getImageUrl(imagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('prompt-library')
    .createSignedUrl(imagePath, 3600)

  if (error) {
    console.error('❌ SIGNED URL ERROR:')
    console.error('   Path requested:', imagePath)
    console.error('   Error details:', error)
    console.error('   Error message:', error.message)
    throw new Error(`Failed to get signed URL: ${error.message}`)
  }
  
  return data.signedUrl
}