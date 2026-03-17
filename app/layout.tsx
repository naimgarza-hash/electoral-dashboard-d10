import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Alcance Electoral — Distrito 10 NL',
  description: 'Dashboard de alcance electoral para el Distrito Federal 10 de Nuevo León',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  )
}
