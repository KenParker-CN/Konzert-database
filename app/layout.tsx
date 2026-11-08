import type { Metadata } from 'next'
import { Google_Sans } from 'next/font/google'
import type { ReactNode } from 'react'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ScrollProgress } from '@/components/ScrollProgress'
import { NavigationProgress } from '@/components/NavigationProgress'
import { cn } from "@/lib/utils";

const googleSans = Google_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-google-sans',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://konzert-database.vercel.app'),
  title: 'Konzert · Classical music archive',
  description: 'Browse composers and their catalogue works.',
  verification: {
    google: 'VbRAlEXC_6Jr6NeWHtGuTLvPFTr0_ck5O_S55s-gIl0',
  },
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
      <html lang="en" suppressHydrationWarning className={cn("font-sans", googleSans.variable)}>
      <head>
          <script id="theme-init" dangerouslySetInnerHTML={{ __html: themeScript }} />
          <title></title>
      </head>
      <body>
      <ThemeProvider>
        <TooltipProvider>
          <ScrollProgress />
          <NavigationProgress />
          {children}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
      </body>
      </html>
  )
}
