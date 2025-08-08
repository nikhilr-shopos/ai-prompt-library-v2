"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { X, Upload, Loader2 } from "lucide-react"
import Image from "next/image"
import { updatePromptCardComplete, validateFile, getImageUrl } from "@/lib/storage"

interface PromptCard {
  id: string
  output_image_path: string
  reference_image_path: string
  prompt: string
  metadata: string
  client: string
  model: string
  llm_used?: string
  seed: string
  notes?: string
  is_favorited: boolean
  created_at: string
  outputImageUrl?: string
  referenceImageUrl?: string
}

interface ImageState {
  type: "existing" | "staged_delete" | "new"
  originalPath?: string
  originalUrl?: string
  newFile?: File
  newPreview?: string
  markedForDeletion: boolean
}

interface EditFormState {
  outputImage: ImageState
  referenceImage: ImageState
  prompt: string
  metadata: string
  client: string
  model: string
  llmUsed: string
  seed: string
  notes: string
}

interface ValidationErrors {
  outputImage?: string
  referenceImage?: string
  prompt?: string
  metadata?: string
  client?: string
  model?: string
  seed?: string
  general?: string
}

interface EditCardModalProps {
  card: PromptCard | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface EditableImageProps {
  imageState: ImageState
  label: string
  onImageChange: (newState: ImageState) => void
  required?: boolean
  error?: string
  loading?: boolean
}

const useEditForm = (initialCard: PromptCard | null) => {
  const [formState, setFormState] = useState<EditFormState>({
    outputImage: {
      type: "existing",
      originalPath: "",
      markedForDeletion: false,
    },
    referenceImage: {
      type: "existing",
      originalPath: "",
      markedForDeletion: false,
    },
    prompt: "",
    metadata: "",
    client: "",
    model: "",
    llmUsed: "",
    seed: "",
    notes: "",
  })

  const [imageUrls, setImageUrls] = useState<{
    output?: string
    reference?: string
  }>({})

  useEffect(() => {
    if (initialCard) {
      // Load signed URLs for existing images
      const loadImageUrls = async () => {
        try {
          const [outputUrl, referenceUrl] = await Promise.all([
            getImageUrl(initialCard.output_image_path),
            getImageUrl(initialCard.reference_image_path)
          ])
          setImageUrls({
            output: outputUrl,
            reference: referenceUrl
          })
        } catch (error) {
          console.error('Failed to load image URLs:', error)
        }
      }

      setFormState({
        outputImage: {
          type: "existing",
          originalPath: initialCard.output_image_path,
          markedForDeletion: false,
        },
        referenceImage: {
          type: "existing",
          originalPath: initialCard.reference_image_path,
          markedForDeletion: false,
        },
        prompt: initialCard.prompt,
        metadata: initialCard.metadata,
        client: initialCard.client,
        model: initialCard.model,
        llmUsed: initialCard.llm_used || "",
        seed: initialCard.seed,
        notes: initialCard.notes || "",
      })

      loadImageUrls()
    }
  }, [initialCard])

  return { formState, setFormState, imageUrls }
}

const FileDropzone = ({
  onFileSelect,
  accept,
  maxSize,
  loading = false,
}: {
  onFileSelect: (file: File) => void
  accept: string
  maxSize: number
  loading?: boolean
}) => {
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!loading) setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (loading) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFileSelect(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (loading) return
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelect(files[0])
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } ${
        dragOver && !loading ? "border-[#2383E2] bg-blue-50" : "border-[#E8E8E8] bg-[#FAFAFA]"
      } hover:border-[#2383E2] hover:bg-blue-50`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !loading && fileInputRef.current?.click()}
    >
      <Upload className="w-8 h-8 text-[#787774] mx-auto mb-3" />
      <p className="text-[14px] text-[#787774] mb-1">Drag and drop new image here, or browse</p>
      <p className="text-[12px] text-[#9B9A97]">PNG, JPG, GIF, WebP up to 50MB</p>
      <input 
        ref={fileInputRef} 
        type="file" 
        accept={accept} 
        onChange={handleFileSelect} 
        className="hidden" 
        disabled={loading}
      />
    </div>
  )
}

const EditableImage = ({ imageState, label, onImageChange, required, error, loading = false }: EditableImageProps) => {
  const handleMarkForDeletion = () => {
    if (loading) return
    onImageChange({
      ...imageState,
      type: "staged_delete",
      markedForDeletion: true,
    })
  }

  const handleConfirmRemoval = () => {
    if (loading) return
    onImageChange({
      ...imageState,
      type: "staged_delete",
      markedForDeletion: true,
      newFile: undefined,
      newPreview: undefined,
    })
  }

  const handleFileSelect = (file: File) => {
    if (loading) return
    
    try {
      validateFile(file, 50)
    } catch (validationError) {
      console.error('File validation failed:', validationError)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      onImageChange({
        ...imageState,
        type: "new",
        newFile: file,
        newPreview: e.target?.result as string,
        markedForDeletion: imageState.markedForDeletion,
      })
    }
    reader.readAsDataURL(file)
  }

  const handleClearNew = () => {
    if (loading) return
    onImageChange({
      ...imageState,
      type: imageState.markedForDeletion ? "staged_delete" : "existing",
      newFile: undefined,
      newPreview: undefined,
    })
  }

  if (imageState.type === "existing") {
    return (
      <div className="space-y-2">
        <label className="block text-[14px] font-medium text-[#1F1F1F]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative border-2 border-[#E8E8E8] rounded-lg p-4 bg-white transition-colors hover:border-[#9B9A97]">
          <button
            type="button"
            onClick={handleMarkForDeletion}
            disabled={loading}
            className="absolute top-2 right-2 w-6 h-6 bg-[#DC2626] text-white rounded-full flex items-center justify-center hover:bg-[#B91C1C] transition-colors z-10 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✕
          </button>
          <div className="space-y-3">
            <div className="relative w-full h-48">
              <Image
                src={imageState.originalUrl || "/placeholder.svg"}
                alt={`Existing ${label}`}
                fill
                className="object-contain rounded"
              />
            </div>
            <p className="text-[12px] text-[#9B9A97] text-center">
              {imageState.originalPath?.split("/").pop() || "existing-image.jpg"}
            </p>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  if (imageState.type === "staged_delete") {
    return (
      <div className="space-y-2">
        <label className="block text-[14px] font-medium text-[#1F1F1F]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="border-2 border-dashed border-[#FECACA] rounded-lg p-6 bg-[#FEF2F2] text-center">
          <FileDropzone onFileSelect={handleFileSelect} accept="image/*" maxSize={50 * 1024 * 1024} loading={loading} />
          <button
            type="button"
            onClick={handleConfirmRemoval}
            disabled={loading}
            className="mt-3 px-4 py-2 bg-[#DC2626] text-white rounded-md text-[14px] hover:bg-[#B91C1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Remove Original Image
          </button>
          <p className="text-[#DC2626] text-[12px] mt-2 font-medium">Original image marked for deletion</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  if (imageState.type === "new") {
    return (
      <div className="space-y-2">
        <label className="block text-[14px] font-medium text-[#1F1F1F]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative border-2 border-[#E8E8E8] rounded-lg p-4 bg-white transition-colors hover:border-[#9B9A97]">
          <button
            type="button"
            onClick={handleClearNew}
            disabled={loading}
            className="absolute top-2 right-2 w-6 h-6 bg-[#DC2626] text-white rounded-full flex items-center justify-center hover:bg-[#B91C1C] transition-colors z-10 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✕
          </button>
          <div className="space-y-3">
            <div className="relative w-full h-48">
              <Image
                src={imageState.newPreview || "/placeholder.svg"}
                alt={`New ${label}`}
                fill
                className="object-contain rounded"
              />
            </div>
            <p className="text-[12px] text-[#9B9A97] text-center">{imageState.newFile?.name}</p>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  return null
}

export default function EditCardModal({ card, isOpen, onClose, onSuccess }: EditCardModalProps) {
  const { formState, setFormState, imageUrls } = useEditForm(card)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const [hasChanges, setHasChanges] = useState(false)

  const firstInputRef = useRef<HTMLTextAreaElement>(null)

  // Update image URLs in form state when they load
  useEffect(() => {
    if (imageUrls.output && formState.outputImage.type === "existing") {
      setFormState(prev => ({
        ...prev,
        outputImage: {
          ...prev.outputImage,
          originalUrl: imageUrls.output
        }
      }))
    }
    if (imageUrls.reference && formState.referenceImage.type === "existing") {
      setFormState(prev => ({
        ...prev,
        referenceImage: {
          ...prev.referenceImage,
          originalUrl: imageUrls.reference
        }
      }))
    }
  }, [imageUrls, formState.outputImage.type, formState.referenceImage.type])

  // Focus management
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // Track form changes
  useEffect(() => {
    if (!card) return

    const hasImageChanges = formState.outputImage.type !== "existing" || formState.referenceImage.type !== "existing"

    const hasTextChanges =
      formState.prompt !== card.prompt ||
      formState.metadata !== card.metadata ||
      formState.client !== card.client ||
      formState.model !== card.model ||
      formState.llmUsed !== (card.llm_used || "") ||
      formState.seed !== card.seed ||
      formState.notes !== (card.notes || "")

    setHasChanges(hasImageChanges || hasTextChanges)
  }, [formState, card])

  const validateEditForm = (formState: EditFormState): ValidationErrors => {
    const errors: ValidationErrors = {}

    // Check required images
    if (formState.outputImage.type === "staged_delete" && !formState.outputImage.newFile) {
      errors.outputImage = "Output image is required"
    }

    if (formState.referenceImage.type === "staged_delete" && !formState.referenceImage.newFile) {
      errors.referenceImage = "Reference image is required"
    }

    // Validate text fields
    if (!formState.prompt.trim()) errors.prompt = "Prompt is required"
    if (!formState.metadata.trim()) errors.metadata = "Metadata is required"
    if (!formState.client.trim()) errors.client = "Client is required"
    if (!formState.model.trim()) errors.model = "Model is required"
    if (!formState.seed.trim()) errors.seed = "Seed is required"

    return errors
  }

  const handleInputChange = (field: keyof EditFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleImageChange = (imageType: "outputImage" | "referenceImage", newState: ImageState) => {
    setFormState((prev) => ({ ...prev, [imageType]: newState }))
    // Clear error when image state changes
    if (errors[imageType]) {
      setErrors((prev) => ({ ...prev, [imageType]: undefined }))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validateEditForm(formState)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    if (!card) return

    try {
      setLoading(true)
      setErrors({})
      setUploadProgress("Preparing update...")

      // Prepare update data
      const updateData = {
        outputImage: formState.outputImage.type === "new" ? formState.outputImage.newFile : undefined,
        referenceImage: formState.referenceImage.type === "new" ? formState.referenceImage.newFile : undefined,
        prompt: formState.prompt.trim(),
        metadata: formState.metadata.trim(),
        client: formState.client.trim(),
        model: formState.model.trim(),
        llmUsed: formState.llmUsed.trim() || undefined,
        seed: formState.seed.trim(),
        notes: formState.notes.trim() || undefined,
      }

      // Prepare current paths for cleanup
      const currentPaths = {
        output_image_path: formState.outputImage.type === "new" ? card.output_image_path : undefined,
        reference_image_path: formState.referenceImage.type === "new" ? card.reference_image_path : undefined,
      }

      setUploadProgress("Updating...")

      // Use direct Supabase update
      await updatePromptCardComplete(card.id, updateData, currentPaths)

      setUploadProgress("Update complete!")
      
      // ✅ FIXED: Direct close without confirmation after successful save
      onSuccess()
      onClose() // Direct close, no handleClose() call
      
    } catch (error) {
      console.error("Direct update error:", error)
      setErrors({ 
        general: error instanceof Error 
          ? error.message 
          : "Failed to update prompt card. Please try again." 
      })
    } finally {
      setLoading(false)
      setUploadProgress("")
    }
  }

  // ✅ KEEP: Custom confirmation dialog for closing with unsaved changes
  const handleClose = () => {
    if (hasChanges && !loading) {
      // ✅ Use custom confirmation dialog instead of window.confirm()
      const confirmDiscard = () => {
        return new Promise<boolean>((resolve) => {
          const modal = document.createElement('div')
          modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50'
          modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 class="text-lg font-semibold mb-4 text-gray-900">Discard Changes</h3>
              <p class="text-gray-600 mb-6">
                You have unsaved changes. Are you sure you want to discard them?
              </p>
              <div class="flex gap-3 justify-end">
                <button id="cancel-discard" class="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
                  Continue Editing
                </button>
                <button id="confirm-discard" class="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 transition-colors">
                  Discard Changes
                </button>
              </div>
            </div>
          `
          
          document.body.appendChild(modal)
          
          const handleConfirm = () => {
            document.body.removeChild(modal)
            resolve(true)
          }
          
          const handleCancel = () => {
            document.body.removeChild(modal)
            resolve(false)
          }
          
          modal.querySelector('#confirm-discard')?.addEventListener('click', handleConfirm)
          modal.querySelector('#cancel-discard')?.addEventListener('click', handleCancel)
          
          // Close on outside click
          modal.addEventListener('click', (e) => {
            if (e.target === modal) handleCancel()
          })
        })
      }

      // Use Promise-based confirmation
      confirmDiscard().then((confirmed) => {
        if (confirmed) {
          onClose()
        }
      })
    } else {
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose()
    }
  }

  if (!isOpen || !card) return null

  const isFormValid = Object.keys(validateEditForm(formState)).length === 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-[#EBEBEB]">
          <h2 className="text-[24px] font-semibold text-[#1F1F1F]">Edit Prompt Entry</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[#F1F1EF] rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-[#9B9A97]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-8 space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-600">{uploadProgress}</p>
            </div>
          )}

          {/* Image Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EditableImage
              imageState={formState.outputImage}
              label="Output Image"
              onImageChange={(newState) => handleImageChange("outputImage", newState)}
              required
              error={errors.outputImage}
              loading={loading}
            />

            <EditableImage
              imageState={formState.referenceImage}
              label="Reference Image"
              onImageChange={(newState) => handleImageChange("referenceImage", newState)}
              required
              error={errors.referenceImage}
              loading={loading}
            />
          </div>

          {/* Text Fields */}
          <div>
            <label className="block text-[14px] font-medium text-[#1F1F1F] mb-2">
              Prompt
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <textarea
                ref={firstInputRef}
                value={formState.prompt}
                onChange={(e) => handleInputChange("prompt", e.target.value)}
                placeholder="Enter the prompt used to generate this image..."
                disabled={loading}
                className={`w-full min-h-[120px] p-4 border rounded-lg resize-y text-[14px] text-[#1F1F1F] placeholder-[#9B9A97] transition-colors ${
                  errors.prompt ? "border-red-300 bg-red-50" : "border-[#E8E8E8] bg-white focus:border-[#2383E2]"
                } focus:outline-none focus:ring-3 focus:ring-blue-100 disabled:opacity-50`}
              />
              <div className="absolute bottom-2 right-2 text-[12px] text-[#9B9A97]">
                {formState.prompt.length} characters
              </div>
            </div>
            {errors.prompt && <p className="mt-2 text-sm text-red-600">{errors.prompt}</p>}
          </div>

          <div>
            <label className="block text-[14px] font-medium text-[#1F1F1F] mb-2">
              Metadata
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              value={formState.metadata}
              onChange={(e) => handleInputChange("metadata", e.target.value)}
              placeholder="Style, resolution, aspect ratio, quality, etc..."
              disabled={loading}
              className={`w-full min-h-[80px] p-4 border rounded-lg resize-y text-[14px] text-[#1F1F1F] placeholder-[#9B9A97] transition-colors ${
                errors.metadata ? "border-red-300 bg-red-50" : "border-[#E8E8E8] bg-white focus:border-[#2383E2]"
              } focus:outline-none focus:ring-3 focus:ring-blue-100 disabled:opacity-50`}
            />
            {errors.metadata && <p className="mt-2 text-sm text-red-600">{errors.metadata}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-medium text-[#1F1F1F] mb-2">
                Client
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formState.client}
                onChange={(e) => handleInputChange("client", e.target.value)}
                placeholder="e.g., Brand A, Agency X"
                disabled={loading}
                className={`w-full p-3 border rounded-lg text-[14px] text-[#1F1F1F] placeholder-[#9B9A97] transition-colors ${
                  errors.client ? "border-red-300 bg-red-50" : "border-[#E8E8E8] bg-white focus:border-[#2383E2]"
                } focus:outline-none focus:ring-3 focus:ring-blue-100 disabled:opacity-50`}
              />
              {errors.client && <p className="mt-2 text-sm text-red-600">{errors.client}</p>}
            </div>

            <div>
              <label className="block text-[14px] font-medium text-[#1F1F1F] mb-2">
                Model
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formState.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
                placeholder="e.g., DALL-E 3, Midjourney v6"
                disabled={loading}
                className={`w-full p-3 border rounded-lg text-[14px] text-[#1F1F1F] placeholder-[#9B9A97] transition-colors ${
                  errors.model ? "border-red-300 bg-red-50" : "border-[#E8E8E8] bg-white focus:border-[#2383E2]"
                } focus:outline-none focus:ring-3 focus:ring-blue-100 disabled:opacity-50`}
              />
              {errors.model && <p className="mt-2 text-sm text-red-600">{errors.model}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-medium text-[#1F1F1F] mb-2">LLM Used</label>
              <input
                type="text"
                value={formState.llmUsed}
                onChange={(e) => handleInputChange("llmUsed", e.target.value)}
                placeholder="e.g., GPT-4, Claude, Gemini"
                disabled={loading}
                className="w-full p-3 border border-[#E8E8E8] rounded-lg text-[14px] text-[#1F1F1F] placeholder-[#9B9A97] bg-white focus:border-[#2383E2] focus:outline-none focus:ring-3 focus:ring-blue-100 transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[14px] font-medium text-[#1F1F1F] mb-2">
                Seed
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formState.seed}
                onChange={(e) => handleInputChange("seed", e.target.value)}
                placeholder="e.g., 123456789"
                disabled={loading}
                className={`w-full p-3 border rounded-lg text-[14px] text-[#1F1F1F] placeholder-[#9B9A97] transition-colors ${
                  errors.seed ? "border-red-300 bg-red-50" : "border-[#E8E8E8] bg-white focus:border-[#2383E2]"
                } focus:outline-none focus:ring-3 focus:ring-blue-100 disabled:opacity-50`}
              />
              {errors.seed && <p className="mt-2 text-sm text-red-600">{errors.seed}</p>}
            </div>
          </div>

          <div>
            <label className="block text-[14px] font-medium text-[#1F1F1F] mb-2">Notes (Optional)</label>
            <textarea
              value={formState.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Additional notes, observations, or comments..."
              disabled={loading}
              className="w-full min-h-[100px] p-4 border border-[#E8E8E8] rounded-lg resize-y text-[14px] text-[#1F1F1F] placeholder-[#9B9A97] bg-white focus:border-[#2383E2] focus:outline-none focus:ring-3 focus:ring-blue-100 transition-colors disabled:opacity-50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-6 border-t border-[#EBEBEB]">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-3 border border-[#E8E8E8] rounded-lg text-[14px] font-medium text-[#787774] bg-white hover:bg-[#F1F1EF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || loading || !hasChanges}
              className="px-6 py-3 bg-[#0F7B6C] text-white rounded-lg text-[14px] font-medium hover:bg-[#0D6558] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}