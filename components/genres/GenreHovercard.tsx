'use client'

import {useRef, useState, type ReactNode} from 'react'
import {createPortal} from 'react-dom'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'
import type {Locale} from '@/lib/i18n/config'
import GenreIntroduction from './GenreIntroduction'

export default function GenreHovercard({
    genreTerm,
    genreWikiID,
    locale,
    children,
}: {
    genreTerm: string
    genreWikiID?: string
    locale: Locale
    children: ReactNode
}) {
    const [position, setPosition] = useState<{top: number; left: number} | null>(null)
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const cancelHide = () => {
        if (hideTimer.current) {
            clearTimeout(hideTimer.current)
            hideTimer.current = null
        }
    }

    const scheduleHide = () => {
        cancelHide()
        hideTimer.current = setTimeout(() => setPosition(null), 150)
    }

    const show = (e: React.MouseEvent<HTMLElement>) => {
        cancelHide()
        const rect = e.currentTarget.getBoundingClientRect()
        const cardWidth = 288
        let left = rect.left
        if (left + cardWidth > window.innerWidth - 16) left = window.innerWidth - cardWidth - 16
        if (left < 16) left = 16
        setPosition({top: rect.bottom + 6, left})
    }

    return (
        <span
            className="inline-flex"
            onMouseEnter={show}
            onMouseLeave={scheduleHide}
        >
            {children}
            {position && createPortal(
                <div
                    className="fixed z-[100] w-72 max-w-72 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-xl"
                    style={{top: position.top, left: position.left}}
                    onMouseEnter={cancelHide}
                    onMouseLeave={scheduleHide}
                >
                    <div className="mb-1.5 text-sm font-semibold text-slate-900">
                        {getLocalizedWorkTerm(genreTerm, 'type', locale)}
                    </div>
                    <GenreIntroduction wikiID={genreWikiID} locale={locale} variant="dialog"/>
                </div>,
                document.body,
            )}
        </span>
    )
}
