'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'
const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void }>({ theme: 'system', setTheme: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system')
  useEffect(() => { const saved = window.localStorage.getItem('parker-theme') as Theme | null; if (saved === 'light' || saved === 'dark' || saved === 'system') setTheme(saved) }, [])
  useEffect(() => { const root = document.documentElement; root.dataset.theme = theme; window.localStorage.setItem('parker-theme', theme) }, [theme])
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() { return useContext(ThemeContext) }
