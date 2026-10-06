import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from '@/components/ui/toast'
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: 'Parker’s · Classical music archive',
  description: 'Browse composers and their catalogue works.',
}

const themeScript = `(() => {
  try {
    const saved = localStorage.getItem('parker-theme')
    const valid =
      saved === 'light' ||
      saved === 'dark' ||
      saved === 'system'

    document.documentElement.dataset.theme =
      valid ? saved : 'system'
  } catch {
    document.documentElement.dataset.theme = 'system'
  }
})()`

export default function RootLayout({
                                      children,
                                    }: Readonly<{ children: ReactNode }>) {
  return (
      <html lang="en" suppressHydrationWarning className={cn("font-sans")}>
      <head>
          <title></title>
        <script
            dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
      </body>
      </html>
  )
}