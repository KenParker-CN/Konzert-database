'use client'

import { useTheme } from './ThemeProvider'

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  return <label className="theme-selector"><span className="sr-only">Theme</span><span aria-hidden="true">◐</span><select value={theme} onChange={event => setTheme(event.target.value as 'light' | 'dark' | 'system')} aria-label="Theme"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
}
