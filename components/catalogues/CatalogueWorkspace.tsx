'use client'

import {useEffect, useMemo, useRef, useState, type ReactNode} from 'react'
import Link from 'next/link'
import {createPortal} from 'react-dom'
import type {getCatalogueDirectory} from '@/lib/db/composers'
import {localePath, type Locale} from '@/lib/i18n/config'

type CatalogueEntry = Awaited<ReturnType<typeof getCatalogueDirectory>>[number]

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function getSortInitial(name: string): string {
    const trimmed = name.trim()
    if (!trimmed) return '#'
    const first = trimmed[0].toUpperCase()
    return ALPHABET.includes(first) ? first : '#'
}

export default function CatalogueWorkspace({
    catalogues,
    currentCatalogue,
    locale,
    children,
}: {
    catalogues: CatalogueEntry[]
    currentCatalogue: string
    locale: Locale
    children: ReactNode
}) {
    const [hoveredLetter, setHoveredLetter] = useState<string | null>(null)
    const [letterPos, setLetterPos] = useState<{top: number; left: number} | null>(null)
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const sortedCatalogues = useMemo(() => {
        return [...catalogues].sort((left, right) =>
            (left.composerNameSort || left.composerName).localeCompare(
                right.composerNameSort || right.composerName,
                undefined,
                {numeric: true, sensitivity: 'base'},
            ),
        )
    }, [catalogues])

    const groupedByLetter = useMemo(() => {
        const groups: Record<string, CatalogueEntry[]> = {}
        for (const entry of sortedCatalogues) {
            const letter = getSortInitial(entry.composerNameSort || entry.composerName)
            if (!groups[letter]) groups[letter] = []
            groups[letter].push(entry)
        }
        return groups
    }, [sortedCatalogues])

    const activeLetter = useMemo(() => {
        const activeEntry = sortedCatalogues.find(entry => entry.catalogue === currentCatalogue)
        if (!activeEntry) return ''
        return getSortInitial(activeEntry.composerNameSort || activeEntry.composerName)
    }, [sortedCatalogues, currentCatalogue])

    useEffect(() => {
        return () => {
            if (hideTimer.current) clearTimeout(hideTimer.current)
        }
    }, [])

    const cancelHide = () => {
        if (hideTimer.current) {
            clearTimeout(hideTimer.current)
            hideTimer.current = null
        }
    }

    const scheduleHide = () => {
        cancelHide()
        hideTimer.current = setTimeout(() => {
            setHoveredLetter(null)
            setLetterPos(null)
        }, 150)
    }

    const showLetter = (letter: string, el: HTMLElement) => {
        cancelHide()
        const rect = el.getBoundingClientRect()
        setHoveredLetter(letter)
        setLetterPos({top: rect.bottom + 4, left: rect.left})
    }

    const hoveredEntries = hoveredLetter ? groupedByLetter[hoveredLetter] ?? [] : []

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-300 items-center justify-center gap-0.5 overflow-x-auto px-3 py-2 lg:px-10">

                    {ALPHABET.split('').map(letter => {
                        const hasEntries = Boolean(groupedByLetter[letter]?.length)
                        const isActive = activeLetter === letter
                        return (
                            <button
                                key={letter}
                                type="button"
                                disabled={!hasEntries}
                                onMouseEnter={e => hasEntries && showLetter(letter, e.currentTarget)}
                                onFocus={e => hasEntries && showLetter(letter, e.currentTarget)}
                                onMouseLeave={scheduleHide}
                                onBlur={scheduleHide}
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-medium transition-colors ${
                                    isActive
                                        ? 'bg-blue-600 text-white'
                                        : hasEntries
                                            ? 'text-slate-600 hover:bg-slate-100'
                                            : 'text-slate-300'
                                }`}
                                aria-label={letter}
                            >
                                {letter}
                            </button>
                        )
                    })}
                </div>
            </div>
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
                {children}
            </div>

            {hoveredLetter && letterPos && hoveredEntries.length > 0 && createPortal(
                <div
                    className="fixed z-[100] w-64 rounded-b-lg border border-t-0 border-slate-200 bg-white shadow-xl"
                    style={{
                        top: letterPos.top,
                        left: Math.min(letterPos.left, window.innerWidth - 280),
                    }}
                    onMouseEnter={cancelHide}
                    onMouseLeave={scheduleHide}
                >
                    <div className="px-3 pb-1 pt-2 text-xs font-semibold text-slate-400">
                        {hoveredLetter}
                    </div>
                    <ul className="flex max-h-80 flex-col gap-0.5 overflow-y-auto p-2 pt-0">
                        {hoveredEntries.map(entry => {
                            const label = entry.composerNameSort || entry.composerName
                            const active = entry.catalogue === currentCatalogue
                            return (
                                <li key={entry.catalogue}>
                                    <Link
                                        href={localePath(locale, `/catalogues/${entry.catalogue}`)}
                                        aria-current={active ? 'page' : undefined}
                                        className={`block rounded-md px-2.5 py-1.5 text-sm leading-5 transition-colors ${active ? 'bg-blue-50 font-semibold text-blue-700' : 'font-medium text-slate-700 hover:bg-slate-100'}`}
                                    >
                                        <span className="block truncate">{label}</span>
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </div>,
                document.body,
            )}
        </div>
    )
}