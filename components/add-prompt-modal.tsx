"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, Upload, Loader2 } from "lucide-react"
import Image from "next/image"

interface FormData {
  outputImage: File | null
  referenceImage: File | null
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

interface ImagePreview {
  output?: string
  reference?: string
}

interface AddPromptModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddPromptModal({ isOpen, onClose, onSuccess }: AddPromptModalProps) {
  const [formData, setFormData] = useState<FormData>({
    outputImage: null,
    referenceImage: null,
    prompt: "",
    metadata: "",
    client: "",
    model: "",
    llmUsed: "",
    seed: "",
    notes: "",
  })

  const [errors, setErrors] = useState<ValidationErrors>({})
  const [previews, setPreviews] = useState<ImagePreview>({})
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const outputFileRef = useRef<HTMLInputElement>(null)
  const referenceFileRef = useRef<HTMLInputElement>(null)
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
    const hasData =
      formData.outputImage ||
      formData.referenceImage ||
      formData.prompt.trim() ||
      formData.metadata.trim() ||
      formData.client.trim() ||
      formData.model.trim() ||
      formData.llmUsed.trim() ||
      formData.seed.trim() ||
      formData.notes.trim()

    setHasChanges(!!hasData)
  }, [formData])

  const validateForm = (data: FormData): ValidationErrors => {
    const errors: ValidationErrors = {}

    if (!data.outputImage) errors.outputImage = "Output image is required"
    if (!data.referenceImage) errors.referenceImage = "Reference image is required"
    if (!data.prompt.trim()) errors.prompt = "Prompt is required"
    if (!data.metadata.trim()) errors.metadata = "Metadata is required"
    if (!data.client.trim()) errors.client = "Client is required"
    if (!data.model.trim()) errors.model = "Model is required"
    if (!data.seed.trim()) errors.seed = "Seed is required"

    return errors
  }

  const handleFileUpload = (file: File, type: "output" | "reference") => {
    // Clear previous errors
    setErrors((prev) => ({ ...prev, [`${type}Image`]: undefined }))

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, [`${type}Image`]: "Please upload PNG, JPG, or GIF files only" }))
      return
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [`${type}Image`]: "File size must be less than 50MB" }))
      return
    }

    // Generate preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviews((prev) => ({
        ...prev,
        [type]: e.target?.result as string,
      }))
    }
    reader.readAsDataURL(file)

    // Update form data
    setFormData((prev) => ({
      ...prev,
      [`${type}Image`]: file,
    }))
  }

  const handleDragOver = (e: React.DragEvent, type: string) => {
    e.preventDefault()
    setDragOver(type)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(null)
  }

  const handleDrop = (e: React.DragEvent, type: "output" | "reference") => {
    e.preventDefault()
    setDragOver(null)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0], type)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "output" | "reference") => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0], type)
    }
  }

  const removeImage = (type: "output" | "reference") => {
    setFormData((prev) => ({
      ...prev,
      [`${type}Image`]: null,
    }))
    setPreviews((prev) => ({
      ...prev,
      [type]: undefined,
    }))
    setErrors((prev) => ({ ...prev, [`${type}Image`]: undefined }))

    // Reset file input
    if (type === "output" && outputFileRef.current) {
      outputFileRef.current.value = ""
    }
    if (type === "reference" && referenceFileRef.current) {
      referenceFileRef.current.value = ""
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validateForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      setLoading(true)
      setErrors({})

      // Validate required fields
      if (!formData.prompt || !formData.metadata || !formData.client || 
          !formData.model || !formData.seed || !formData.outputImage || !formData.referenceImage) {
        throw new Error('Please fill in all required fields and upload both images')
      }

      // Create FormData for file upload
      const submitData = new FormData()
      submitData.append('outputImage', formData.outputImage)
      submitData.append('referenceImage', formData.referenceImage)
      submitData.append('prompt', formData.prompt)
      submitData.append('metadata', formData.metadata)
      submitData.append('client', formData.client)
      submitData.append('model', formData.model)
      submitData.append('llmUsed', formData.llmUsed || '')
      submitData.append('seed', formData.seed)
      submitData.append('notes', formData.notes || '')
      submitData.append('isFavorited', 'false')

      const response = await fetch('/api/cards', {
        method: 'POST',
        body: submitData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create prompt card')
      }

      // Reset form and close modal
      resetForm()
      onSuccess()
      handleClose()
    } catch (error) {
      console.error("Submission error:", error)
      setErrors({ general: error instanceof Error ? error.message : "Failed to save prompt card. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (hasChanges && !loading) {
      if (window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
        resetForm()
        onClose()
      }
    } else {
      resetForm()
      onClose()
    }
  }

  const resetForm = () => {
    setFormData({
      outputImage: null,
      referenceImage: null,
      prompt: "",
      metadata: "",
      client: "",
      model: "",
      llmUsed: "",
      seed: "",
      notes: "",
    })
    setErrors({})
    setPreviews({})
    setHasChanges(false)
    if (outputFileRef.current) outputFileRef.current.value = ""
    if (referenceFileRef.current) referenceFileRef.current.value = ""
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose()
    }
  }

  if (!isOpen) return null

  const isFormValid = Object.keys(validateForm(formData)).length === 0

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
          <h2 className="text-[24px] font-semibold text-[#1F1F1F]">Add New Prompt Entry</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[#F1F1EF] rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-[#9B9A97]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Image Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Output Image */}
            <div>
              <label className="block text-[14px] font-medium text-[#1F1F1F] mb-2">
                Output Image
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver === "output"
                    ? "border-[#2383E2] bg-blue-50"
                    : errors.outputImage
                      ? "border-red-300 bg-red-50"
                      : "border-[#E8E8E8] bg-[#FAFAFA]"
                } hover:border-[#2383E2] hover:bg-blue-50`}
                onDragOver={(e) => handleDragOver(e, "output")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "output")}
              >
                {previews.output ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <Image
                        src={previews.output || "/placeholder.svg"}
                        alt="Output preview"
                        width={200}
                        height={200}
                        className="max-h-48 w-auto rounded-lg object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage("output")}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[12px] text-[#9B9A97]">{formData.outputImage?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-8 h-8 text-[#787774] mx-auto" />
                    <div>
                      <p className="text-[14px] text-[#787774] mb-1">Drag and drop an image here, or browse</p>
                      <p className="text-[12px] text-[#9B9A97]">PNG, JPG, GIF up to 50MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => outputFileRef.current?.click()}
                      className="px-4 py-2 bg-white border border-[#E8E8E8] rounded-lg text-[14px] text-[#1F1F1F] hover:bg-[#F1F1EF] transition-colors"
                    >
                      Browse Files
                    </button>
                  </div>
                )}
                <input
                  ref={outputFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif"
                  onChange={(e) => handleFileSelect(e, "output")}
                  className="hidden"
                />
              </div>
              {errors.outputImage && <p className="mt-2 text-sm text-red-600">{errors.outputImage}</p>}
            </div>

            {/* Reference Image */}
            <div>
              <label className="block text-[14px] font-medium text-[#1F1F1F] mb-2">
                Reference Image
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver === "reference"
                    ? "border-[#2383E2] bg-blue-50"
                    : errors.referenceImage
                      ? "border-red-300 bg-red-50"
                      : "border-[#E8E8E8] bg-[#FAFAFA]"
                } hover:border-[#2383E2] hover:bg-blue-50`}
                onDragOver={(e) => handleDragOver(e, "reference")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "reference")}
              >
                {previews.reference ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <Image
                        src={previews.reference || "/placeholder.svg"}
                        alt="Reference preview"
                        width={200}
                        height={200}
                        className="max-h-48 w-auto rounded-lg object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage("reference")}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[12px] text-[#9B9A97]">{formData.referenceImage?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-8 h-8 text-[#787774] mx-auto" />
                    <div>
                      <p className="text-[14px] text-[#787774] mb-1">Drag and drop an image here, or browse</p>
                      <p className="text-[12px] text-[#9B9A97]">PNG, JPG, GIF up to 50MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => referenceFileRef.current?.click()}
                      className="px-4 py-2 bg-white border border-[#E8E8E8] rounded-lg text-[14px] text-[#1F1F1F] hover:bg-[#F1F1EF] transition-colors"
                    >
                      Browse Files
                    </button>
                  </div>
                )}
                <input
                  ref={referenceFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif"
                  onChange={(e) => handleFileSelect(e, "reference")}
                  className="hidden"
                />
              </div>
              {errors.referenceImage && <p className="mt-2 text-sm text-red-600">{errors.referenceImage}</p>}
            </div>
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
                value={formData.prompt}
                onChange={(e) => handleInputChange("prompt", e.target.value)}
                placeholder="Enter the prompt used to generate this image..."
                className={`w-full min-h-[120px] p-4 border rounded-lg resize-y text-[14px] text-[#1F1F1F] placeholder-[#9B9A97] transition-colors ${
                  errors.prompt ? "border-red-300 bg-red-50" : "border-[#E8E8E8] bg-white focus:border-[#2383E2]"
                } focus:outline-none focus:ring-3 focus:ring-blue-100`}
              />
              <div className="absolute bottom-2 right-2 text-[12px] text-[#9B9A97]">
                {formData.prompt.length} characters
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
              value={formData.metadata}
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
                value={formData.client}
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
                value={formData.model}
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
                value={formData.llmUsed}
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
                value={formData.seed}
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
              value={formData.notes}
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
              disabled={!isFormValid || loading}
              className="px-6 py-3 bg-[#2383E2] text-white rounded-lg text-[14px] font-medium hover:bg-[#1a6bc7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Adding to Library..." : "Add to Library"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
