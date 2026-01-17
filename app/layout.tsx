import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Sidebar } from "@/components/erp/sidebar"

export const metadata: Metadata = {
  title: "Sistema de Controle de Estoque",
  description: "Sistema ERP de Controle de Estoque - Estilo Retrô",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased min-h-screen">
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 p-2 overflow-auto">
            <div className="erp-outset p-1 mb-2">
              <div className="erp-title-bar">
                <span>Sistema de Controle de Estoque v1.0 - [Empresa: MINHA EMPRESA LTDA]</span>
              </div>
            </div>
            {children}
          </main>
        </div>
        <Analytics />
      </body>
    </html>
  )
}
