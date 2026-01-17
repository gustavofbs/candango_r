"use client"

import type { ReactNode } from "react"

interface Column<T> {
  key: keyof T | string
  header: string
  width?: string
  render?: (item: T, index: number) => ReactNode
  align?: "left" | "center" | "right"
}

interface DataGridProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (item: T, index: number) => void
  selectedIndex?: number
  emptyMessage?: string
}

export function DataGrid<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  selectedIndex,
  emptyMessage = "Nenhum registro encontrado",
}: DataGridProps<T>) {
  return (
    <div className="erp-inset overflow-auto max-h-[400px]">
      <table className="erp-table">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                style={{ width: col.width, textAlign: col.align || "left" }}
                className="sticky top-0 bg-[#d4d0c8] z-10"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-4 !bg-white">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(item, rowIndex)}
                className={`cursor-pointer hover:!bg-[#000080] hover:!text-white ${
                  selectedIndex === rowIndex ? "!bg-[#000080] !text-white" : ""
                }`}
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} style={{ textAlign: col.align || "left" }}>
                    {col.render ? col.render(item, rowIndex) : String(item[col.key as keyof T] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
