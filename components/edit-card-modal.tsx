"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { X, Upload, Loader2 } from "lucide-react"
import Image from "next/image"

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

  useEffect(() => {
    if (initialCard) {
      setFormState({
        outputImage: {
          type: "existing",
          originalPath: initialCard.output_image_path,
          originalUrl: initialCard.output_image_path, // In production, use signed URL
          markedForDeletion: false,
        },
        referenceImage: {
          type: "existing",
          originalPath: initialCard.reference_image_path,
          originalUrl: initialCard.reference_image_path, // In production, use signed URL
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
    }
  }, [initialCard])

  return { formState, setFormState }
}

const FileDropzone = ({
  onFileSelect,
  accept,
  maxSize,
}: {
  onFileSelect: (file: File) => void
  accept: string
  maxSize: number
}) => {
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFileSelect(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelect(files[0])
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
        dragOver ? "border-[#2383E2] bg-blue-50" : "border-[#E8E8E8] bg-[#FAFAFA]"
      } hover:border-[#2383E2] hover:bg-blue-50`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <Upload className="w-8 h-8 text-[#787774] mx-auto mb-3" />
      <p className="text-[14px] text-[#787774] mb-1">Drag and drop new image here, or browse</p>
      <p className="text-[12px] text-[#9B9A97]">PNG, JPG, GIF up to 50MB</p>
      <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileSelect} className="hidden" />
    </div>
  )
}

const EditableImage = ({ imageState, label, onImageChange, required, error }: EditableImageProps) => {
  const validateImageFile = (file: File): boolean => {
    const allowedTypes = ["image/png", "image/jpeg", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return false
    }
    if (file.size > 50 * 1024 * 1024) {
      return false
    }
    return true
  }

  const handleMarkForDeletion = () => {
    onImageChange({
      ...imageState,
      type: "staged_delete",
      markedForDeletion: true,
    })
  }

  const handleConfirmRemoval = () => {
    onImageChange({
      ...imageState,
      type: "staged_delete",
      markedForDeletion: true,
      newFile: undefined,
      newPreview: undefined,
    })
  }

  const handleFileSelect = (file: File) => {
    if (!validateImageFile(file)) return

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
            className="absolute top-2 right-2 w-6 h-6 bg-[#DC2626] text-white rounded-full flex items-center justify-center hover:bg-[#B91C1C] transition-colors z-10 text-sm"
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
          <FileDropzone onFileSelect={handleFileSelect} accept="image/*" maxSize={50 * 1024 * 1024} />
          <button
            type="button"
            onClick={handleConfirmRemoval}
            className="mt-3 px-4 py-2 bg-[#DC2626] text-white rounded-md text-[14px] hover:bg-[#B91C1C] transition-colors"
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
            className="absolute top-2 right-2 w-6 h-6 bg-[#DC2626] text-white rounded-full flex items-center justify-center hover:bg-[#B91C1C] transition-colors z-10 text-sm"
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
  const { formState, setFormState } = useEditForm(card)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const firstInputRef = useRef<HTMLTextAreaElement>(null)

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

      // Simulate API call - replace with actual Supabase integration
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock success
      console.log("Form updated:", formState)
      onSuccess()
      handleClose()
    } catch (error) {
      console.error("Update failed:", error)
      setErrors({ general: "Failed to update prompt card. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (hasChanges && !loading) {
      if (window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
        onClose()
      }
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

          {/* Image Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EditableImage
              imageState={formState.outputImage}
              label="Output Image"
              onImageChange={(newState) => handleImageChange("outputImage", newState)}
              required
              error={errors.outputImage}
            />

            <EditableImage
              imageState={formState.referenceImage}
              label="Reference Image"
              onImageChange={(newState) => handleImageChange("referenceImage", newState)}
              required
              error={errors.referenceImage}
            />
          </div>

          {/* Prompt */}
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
                className={`w-full min-h-[120px] p-4 border rounded-lg resize-y text-[14px] text-[#1F1F1F] placeholder-[#9B9A97] transition-colors ${
                  errors.prompt ? "border-red-300 bg-red-50" : "border-[#E8E8E8] bg-white focus:border-[#2383E2]"
                } focus:outline-none focus:ring-3 focus:ring-blue-100`}
              />
              <div className="absolute bottom-2 right-2 text-[12px] text-[#9B9A97]">
                {formState.prompt.length} characters
              </div>
            </div>
            {errors.prompt && <p className="mt-2 text-sm text-red-600">{errors.prompt}</p>}
          </div>

          {/* Metadata */}
          <div>
            <label className="block text-[14px] font-medium text-[#1F1F1F] mb-2">
              Metadata
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              value={formState.metadata}
              onChange={(e) => handleInputChange("metadata", e.target.value)}
              placeholder="Style, resolution, aspect ratio, quality, etc..."
              className={`w-full min-h-[80px] p-4 border rounded-lg resize-y text-[14px] text-[#1F1F1F] placeholder-[#9B9A97] transition-colors ${
                errors.metadata ? "border-red-300 bg-red-50" : "border-[#E8E8E8] bg-white focus:border-[#2383E2]"
              } focus:outline-none focus:ring-3 focus:ring-blue-100`}
            />
            {errors.metadata && <p className="mt-2 text-sm text-red-600">{errors.metadata}</p>}
          </div>

          {/* Client & Model Row */}
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
                className={`w-full p-3 border rounded-lg text-[14px] text-[#1F1F1F] placeholder-[#9B9A97] transition-colors ${
                  errors.client ? "border-red-300 bg-red-50" : "border-[#E8E8E8] bg-white focus:border-[#2383E2]"
                } focus:outline-none focus:ring-3 focus:ring-blue-100`}
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
                className={`w-full p-3 border rounded-lg text-[14px] text-[#1F1F1F] placeholder-[#9B9A97] transition-colors ${
                  errors.model ? "border-red-300 bg-red-50" : "border-[#E8E8E8] bg-white focus:border-[#2383E2]"
                } focus:outline-none focus:ring-3 focus:ring-blue-100`}
              />
              {errors.model && <p className="mt-2 text-sm text-red-600">{errors.model}</p>}
            </div>
          </div>

          {/* LLM Used & Seed Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-medium text-[#1F1F1F] mb-2">LLM Used</label>
              <input
                type="text"
                value={formState.llmUsed}
                onChange={(e) => handleInputChange("llmUsed", e.target.value)}
                placeholder="e.g., GPT-4, Claude, Gemini"
                className="w-full p-3 border border-[#E8E8E8] rounded-lg text-[14px] text-[#1F1F1F] placeholder-[#9B9A97] bg-white focus:border-[#2383E2] focus:outline-none focus:ring-3 focus:ring-blue-100 transition-colors"
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
                className={`w-full p-3 border rounded-lg text-[14px] text-[#1F1F1F] placeholder-[#9B9A97] transition-colors ${
                  errors.seed ? "border-red-300 bg-red-50" : "border-[#E8E8E8] bg-white focus:border-[#2383E2]"
                } focus:outline-none focus:ring-3 focus:ring-blue-100`}
              />
              {errors.seed && <p className="mt-2 text-sm text-red-600">{errors.seed}</p>}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[14px] font-medium text-[#1F1F1F] mb-2">Notes (Optional)</label>
            <textarea
              value={formState.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Additional notes, observations, or comments..."
              className="w-full min-h-[100px] p-4 border border-[#E8E8E8] rounded-lg resize-y text-[14px] text-[#1F1F1F] placeholder-[#9B9A97] bg-white focus:border-[#2383E2] focus:outline-none focus:ring-3 focus:ring-blue-100 transition-colors"
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
