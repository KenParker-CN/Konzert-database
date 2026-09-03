import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { ThemeProvider } from '../components/ThemeProvider'

export const metadata: Metadata = {
  title: 'Parker’s · Classical music archive',
  description: 'A focused explorer for classical works and recordings.',
}

const themeScript = `(() => { try { const saved = localStorage.getItem('parker-theme'); const valid = saved === 'light' || saved === 'dark' || saved === 'system'; document.documentElement.dataset.theme = valid ? saved : 'system'; } catch { document.documentElement.dataset.theme = 'system'; } })()`

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body><ThemeProvider>{children}</ThemeProvider></body></html>
}
