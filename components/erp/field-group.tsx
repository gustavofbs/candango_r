"use client"

import type { ReactNode } from "react"

interface FieldGroupProps {
  label: string
  children: ReactNode
  className?: string
}

export function FieldGroup({ label, children, className = "" }: FieldGroupProps) {
  return (
    <fieldset className={`erp-outset p-2 ${className}`}>
      <legend className="px-1 text-[11px]">{label}</legend>
      {children}
    </fieldset>
  )
}

interface FormFieldProps {
  label: string
  children: ReactNode
  className?: string
  inline?: boolean
}

export function FormField({ label, children, className = "", inline = false }: FormFieldProps) {
  return (
    <div className={`${inline ? "flex items-center gap-2" : ""} ${className}`}>
      <label className="text-[11px] whitespace-nowrap">{label}</label>
      {children}
    </div>
  )
}
