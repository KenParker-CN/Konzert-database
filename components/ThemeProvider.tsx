'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'
const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void }>({ theme: 'system', setTheme: () => {} })

function initialTheme(): Theme {
  if (typeof document === 'undefined') return 'system'
  const value = document.documentElement.dataset.theme
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const saved = window.localStorage.getItem('parker-theme') as Theme | null
    if (saved === 'light' || saved === 'dark' || saved === 'system') setTheme(saved)
    setReady(true)
  }, [])
  useEffect(() => {
    if (!ready) return
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('parker-theme', theme)
  }, [theme, ready])
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() { return useContext(ThemeContext) }
