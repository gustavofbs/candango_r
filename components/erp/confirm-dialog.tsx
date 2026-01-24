"use client"

import type React from "react"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "OK",
  cancelText = "Cancelar",
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] shadow-lg min-w-[400px]">
        {/* Title Bar */}
        <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
          <span className="text-sm font-bold">{title}</span>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-sm mb-6">{message}</p>
          
          {/* Buttons */}
          <div className="flex justify-center gap-3">
            <button
              onClick={onConfirm}
              className="erp-button min-w-[80px]"
            >
              {confirmText}
            </button>
            <button
              onClick={onCancel}
              className="erp-button min-w-[80px]"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
