"use client"

interface ToolbarButton {
  label: string
  onClick: () => void
  icon?: string
  disabled?: boolean
}

interface ToolbarProps {
  buttons: ToolbarButton[]
}

export function Toolbar({ buttons }: ToolbarProps) {
  return (
    <div className="flex gap-1 p-1 erp-outset mb-2">
      {buttons.map((btn, i) => (
        <button
          key={i}
          onClick={btn.onClick}
          disabled={btn.disabled}
          className="erp-button flex items-center gap-1 disabled:opacity-50"
        >
          {btn.icon && <span>{btn.icon}</span>}
          {btn.label}
        </button>
      ))}
    </div>
  )
}
