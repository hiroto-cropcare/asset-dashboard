import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Asset Dashboard',
  description: '資産管理ダッシュボード',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="bg-ink text-text-primary font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
