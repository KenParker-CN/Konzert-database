'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Check, ChevronDown } from 'lucide-react'
import { useI18n } from '@/lib/i18n/client'
import { isLocale, localePath, locales, type Locale } from '@/lib/i18n/config'

const languageNames: Record<Locale, string> = {
    en: 'English',
    zh: '中文',
    fr: 'Français',
    de: 'Deutsch',
    ja: '日本語',
}

function starPoints(cx: number, cy: number, outer: number, inner: number): string {
    const points: string[] = []
    for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? outer : inner
        const angle = (i * Math.PI) / 5 - Math.PI / 2
        points.push(`${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`)
    }
    return points.join(' ')
}

function FlagIcon({ code }: { code: Locale }) {
    const clipId = useId()
    const svgClass = 'h-4 w-6 shrink-0 rounded-[2px] ring-1 ring-black/5'
    if (code === 'en') {
        return (
            <svg viewBox="0 0 60 40" className={svgClass} aria-hidden="true">
                <clipPath id={clipId}><path d="M30,20 h30 v20 z v20 h-30 z h-30 v-20 z h-30 z h30 z"/></clipPath>
                <path d="M0,0 v40 h60 v-40 z" fill="#012169"/>
                <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="8"/>
                <path d="M0,0 L60,40 M60,0 L0,40" clipPath={`url(#${clipId})`} stroke="#C8102E" strokeWidth="5"/>
                <path d="M30,0 v40 M0,20 h60" stroke="#fff" strokeWidth="12"/>
                <path d="M30,0 v40 M0,20 h60" stroke="#C8102E" strokeWidth="7"/>
            </svg>
        )
    }
    if (code === 'zh') {
        return (
            <svg viewBox="0 0 60 40" className={svgClass} aria-hidden="true">
                <rect width="60" height="40" fill="#DE2910"/>
                <polygon points={starPoints(11, 10, 6, 2.3)} fill="#FFDE00"/>
                <polygon points={starPoints(24, 4.5, 2.4, 1.05)} fill="#FFDE00"/>
                <polygon points={starPoints(27.5, 17, 2.4, 1.05)} fill="#FFDE00"/>
                <polygon points={starPoints(23.5, 28.5, 2.4, 1.05)} fill="#FFDE00"/>
                <polygon points={starPoints(13, 34, 2.4, 1.05)} fill="#FFDE00"/>
            </svg>
        )
    }
    if (code === 'fr') {
        return (
            <svg viewBox="0 0 60 40" className={svgClass} aria-hidden="true">
                <rect width="20" height="40" fill="#0055A4"/>
                <rect x="20" width="20" height="40" fill="#FFFFFF"/>
                <rect x="40" width="20" height="40" fill="#EF4135"/>
            </svg>
        )
    }
    if (code === 'de') {
        return (
            <svg viewBox="0 0 60 40" className={svgClass} aria-hidden="true">
                <rect width="60" height="13.34" fill="#000000"/>
                <rect y="13.34" width="60" height="13.32" fill="#DD0000"/>
                <rect y="26.66" width="60" height="13.34" fill="#FFCE00"/>
            </svg>
        )
    }
    return (
        <svg viewBox="0 0 60 40" className={svgClass} aria-hidden="true">
            <rect width="60" height="40" fill="#FFFFFF"/>
            <circle cx="30" cy="20" r="11" fill="#BC002D"/>
        </svg>
    )
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
    const containerRef = useRef<HTMLDivElement>(null)

    const segments = pathname.split('/').filter(Boolean)
    const hasLocalePrefix = segments.length > 0 && isLocale(segments[0])
    const rest = hasLocalePrefix ? segments.slice(1).join('/') : segments.join('/')

    useEffect(() => {
        if (!open) return
        function onPointerDown(event: PointerEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
        }
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') setOpen(false)
        }
        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
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
                <FlagIcon code={locale}/>
                <ChevronDown size={14} aria-hidden="true" className="text-slate-400"/>
            </button>
            {open && <ul role="listbox" aria-label={t('common.language')}
                         className="absolute right-0 z-50 mt-2 min-w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg">
                {locales.map(l => (
                    <li key={l}>
                        <button
                            type="button"
                            role="option"
                            aria-selected={l === locale}
                            onClick={() => switchTo(l)}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-slate-700 hover:bg-slate-100"
                        >
                            <FlagIcon code={l}/>
                            <span className="flex-1">{languageNames[l]}</span>
                            {l === locale && <Check size={14} className="text-blue-600" aria-hidden="true"/>}
                        </button>
                    </li>
                ))}
            </ul>}
        </div>
    )
}