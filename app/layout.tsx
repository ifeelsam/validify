import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'
import { DemoInitializer } from '@/components/demo-initializer'

export const metadata: Metadata = {
  title: 'Validify',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <DemoInitializer />
          {children}
        </Providers>
        <Toaster 
          theme="dark" 
          position="top-right"
          toastOptions={{
            style: {
              background: '#2F2F2F',
              border: '1px solid #404040',
              color: '#E5E5E5',
            },
          }}
        />
      </body>
    </html>
  )
}
