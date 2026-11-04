'use client'

import type {MouseEvent} from 'react'
import {flushSync} from 'react-dom'
import {IconMoon, IconSun} from '@tabler/icons-react'
import {useTheme} from './ThemeProvider'

const REVEAL_DURATION_MS = 500

export default function ThemeSelector() {
  const {theme, setTheme} = useTheme()
  const dark = theme === 'dark'

  const toggleTheme = (event: MouseEvent<HTMLButtonElement>) => {
    const next = dark ? 'light' : 'dark'
    if (!document.startViewTransition) {
      setTheme(next)
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const fromKeyboard = event.detail === 0
    const x = fromKeyboard ? rect.left + rect.width / 2 : event.clientX
    const y = fromKeyboard ? rect.top + rect.height / 2 : event.clientY
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

    const transition = document.startViewTransition(() => {
      flushSync(() => setTheme(next))
    })
    transition.ready.then(() => {
      document.documentElement.animate(
        {clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`]},
        {duration: REVEAL_DURATION_MS, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)'},
      )
    })
  }

  return <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} aria-pressed={dark} title={dark ? 'Switch to light theme' : 'Switch to dark theme'}><span className="sr-only">{dark ? 'Light theme' : 'Dark theme'}</span>{dark ? <IconSun size={18} stroke={2} aria-hidden="true" /> : <IconMoon size={18} stroke={2} aria-hidden="true" />}</button>
}
