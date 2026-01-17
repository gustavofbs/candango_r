"use client"

import type { ReactNode } from "react"

interface ErpWindowProps {
  title: string
  children: ReactNode
  className?: string
}

export function ErpWindow({ title, children, className = "" }: ErpWindowProps) {
  return (
    <div className={`erp-outset ${className}`}>
      <div className="erp-title-bar">
        <span className="flex-1">{title}</span>
        <div className="flex gap-0.5">
          <button className="erp-button !min-w-0 !p-0 w-4 h-4 text-[10px] leading-none">_</button>
          <button className="erp-button !min-w-0 !p-0 w-4 h-4 text-[10px] leading-none">□</button>
          <button className="erp-button !min-w-0 !p-0 w-4 h-4 text-[10px] leading-none">×</button>
        </div>
      </div>
      <div className="p-2">{children}</div>
    </div>
  )
}
