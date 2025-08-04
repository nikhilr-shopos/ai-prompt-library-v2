import { supabase } from './supabase'

// Upload image to Supabase Storage
export async function uploadImage(
  file: File,
  folder: 'output' | 'reference',
  fileName: string
): Promise<string> {
  const filePath = `${folder}/${fileName}`
  
  const { data, error } = await supabase.storage
    .from('prompt-library')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Error uploading image:', error)
    throw new Error(`Failed to upload ${folder} image`)
  }

  return data.path
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
    .createSignedUrl(imagePath, 3600) // 1 hour expiry

  if (error) {
    console.error('Error getting signed URL:', error)
    throw new Error('Failed to get image URL')
  }

  return data.signedUrl
}

// Generate unique filename
export function generateFileName(originalName: string): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  const extension = originalName.split('.').pop()
  return `${timestamp}-${randomId}.${extension}`
} 