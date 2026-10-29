'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {IconCheck, IconChevronDown} from '@tabler/icons-react'
import { useI18n } from '@/lib/i18n/client'
import { isLocale, localePath, locales, type Locale } from '@/lib/i18n/config'

const languageNames: Record<Locale, string> = {
    en: 'English',
    zh: '中文',
    fr: 'Français',
    de: 'Deutsch',
}

/**
 * In-place locale switcher rendered as a borderless ("ghost") button that swaps
 * only the `[locale]` segment and keeps the rest of the pathname intact:
 *
 *   /zh/composers/mozart → /fr/composers/mozart
 */
export default function LanguageSelector() {
    const pathname = usePathname() ?? '/'
    const router = useRouter()
    const { locale, t } = useI18n()
    const [open, setOpen] = useState(false)
    const [opensUpward, setOpensUpward] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const menuRef = useRef<HTMLUListElement>(null)

    const segments = pathname.split('/').filter(Boolean)
    const hasLocalePrefix = segments.length > 0 && isLocale(segments[0])
    const rest = hasLocalePrefix ? segments.slice(1).join('/') : segments.join('/')

    useEffect(() => {
        if (!open) return
        function updatePlacement() {
            const trigger = containerRef.current?.getBoundingClientRect()
            if (!trigger) return
            const menuHeight = menuRef.current?.getBoundingClientRect().height ?? 220
            const roomBelow = window.innerHeight - trigger.bottom
            const roomAbove = trigger.top
            setOpensUpward(roomBelow < menuHeight && roomAbove > roomBelow)
        }
        function onPointerDown(event: PointerEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
        }
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') setOpen(false)
        }
        updatePlacement()
        window.addEventListener('resize', updatePlacement)
        window.addEventListener('scroll', updatePlacement, true)
        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            window.removeEventListener('resize', updatePlacement)
            window.removeEventListener('scroll', updatePlacement, true)
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [open])

    function switchTo(next: Locale) {
        setOpen(false)
        if (next === locale) return
        const search = typeof window !== 'undefined' ? window.location.search : ''
        const target = rest ? localePath(next, `/${rest}`) : localePath(next, '/')
        router.push(`${target}${search}`)
    }

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={t('common.language')}
                onClick={() => setOpen(v => !v)}
                className="flex h-9 items-center gap-1.5 rounded-lg px-1.5 text-slate-600 outline-none transition-colors hover:bg-slate-100 focus-visible:ring-4 focus-visible:ring-blue-100"
            >
                <span className="text-sm font-medium">{languageNames[locale]}</span>
                <IconChevronDown size={14} aria-hidden="true" className="text-slate-400"/>
            </button>
            {open && <ul ref={menuRef} role="listbox" aria-label={t('common.language')}
                         className={`absolute right-0 z-50 max-h-[70vh] min-w-40 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg ${opensUpward ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                {locales.map(l => (
                    <li key={l}>
                        <button
                            type="button"
                            role="option"
                            aria-selected={l === locale}
                            onClick={() => switchTo(l)}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-slate-700 hover:bg-slate-100"
                        >
                            <span className="flex-1">{languageNames[l]}</span>
                            {l === locale && <IconCheck size={14} className="text-blue-600" aria-hidden="true"/>}
                        </button>
                    </li>
                ))}
            </ul>}
        </div>
    )
}
