"use client"

import type React from "react"

type StatusColor = "green" | "red" | "yellow" | "cyan" | "white" | "orange"

interface StatusBadgeProps {
  color: StatusColor
  children: React.ReactNode
  className?: string
}

export function StatusBadge({ color, children, className = "" }: StatusBadgeProps) {
  const colorClasses: Record<StatusColor, string> = {
    green: "bg-[#00ff00] text-black",
    red: "bg-[#ff0000] text-white",
    yellow: "bg-[#ffff00] text-black",
    cyan: "bg-[#00ffff] text-black",
    white: "bg-white text-black",
    orange: "bg-[#ffa500] text-black",
  }

  return <span className={`px-1 text-[10px] ${colorClasses[color]} ${className}`}>{children}</span>
}
