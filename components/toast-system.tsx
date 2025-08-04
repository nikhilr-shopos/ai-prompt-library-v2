"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { X, CheckCircle, XCircle, Info } from "lucide-react"

interface Toast {
  id: string
  type: "success" | "error" | "info"
  message: string
  duration: number
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

interface ToastProps {
  toast: Toast
  onRemove: (id: string) => void
}

const Toast = ({ toast, onRemove }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, toast.duration)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  const getToastIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="w-4 h-4" />
      case "error":
        return <XCircle className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  const getToastStyles = () => {
    switch (toast.type) {
      case "success":
        return "bg-[#10B981] text-white"
      case "error":
        return "bg-[#DC2626] text-white"
      default:
        return "bg-[#2383E2] text-white"
    }
  }

  return (
    <div
      className={`${getToastStyles()} rounded-lg px-4 py-3 shadow-lg flex items-center justify-between min-w-[300px] animate-in slide-in-from-right-full duration-300`}
    >
      <div className="flex items-center gap-2">
        {getToastIcon()}
        <span className="text-[14px] font-medium">{toast.message}</span>
      </div>
      <button onClick={() => onRemove(toast.id)} className="text-white/80 hover:text-white transition-colors p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

const ToastContainer = () => {
  const context = useContext(ToastContext)
  if (!context) return null

  const { toasts, removeToast } = context

  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (toastData: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toastData, id }

    setToasts((prev) => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}
