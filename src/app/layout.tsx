import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bimbo.by | Premium Marketplace',
  description: 'Автономный маркетплейс нового поколения',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}