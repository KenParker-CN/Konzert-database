'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const dark = theme === 'dark'
  return <button type="button" className="theme-toggle" onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} aria-pressed={dark} title={dark ? 'Switch to light theme' : 'Switch to dark theme'}><span className="sr-only">{dark ? 'Light theme' : 'Dark theme'}</span>{dark ? <Sun size={17} strokeWidth={2} aria-hidden="true" /> : <Moon size={17} strokeWidth={2} aria-hidden="true" />}</button>
}
