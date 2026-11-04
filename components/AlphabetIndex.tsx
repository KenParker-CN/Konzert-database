'use client'

import {useEffect, useMemo, useRef, useState} from 'react'
import Link from 'next/link'
import {createPortal} from 'react-dom'

export type AlphabetIndexItem = {key: string; sortName: string; label: string; href: string}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function getSortInitial(name: string): string {
    const trimmed = name.trim()
    if (!trimmed) return '#'
    const first = trimmed[0].toUpperCase()
    return ALPHABET.includes(first) ? first : '#'
}

export default function AlphabetIndex({items, activeKey}: {items: AlphabetIndexItem[]; activeKey: string}) {
    const [hoveredLetter, setHoveredLetter] = useState<string | null>(null)
    const [letterPos, setLetterPos] = useState<{top: number; left: number} | null>(null)
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const sortedItems = useMemo(() => {
        return [...items].sort((left, right) =>
            left.sortName.localeCompare(right.sortName, undefined, {numeric: true, sensitivity: 'base'}),
        )
    }, [items])

    const groupedByLetter = useMemo(() => {
        const groups: Record<string, AlphabetIndexItem[]> = {}
        for (const item of sortedItems) {
            const letter = getSortInitial(item.sortName)
            if (!groups[letter]) groups[letter] = []
            groups[letter].push(item)
        }
        return groups
    }, [sortedItems])

    const activeLetter = useMemo(() => {
        const activeItem = sortedItems.find(item => item.key === activeKey)
        return activeItem ? getSortInitial(activeItem.sortName) : ''
    }, [sortedItems, activeKey])

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

    const hoveredItems = hoveredLetter ? groupedByLetter[hoveredLetter] ?? [] : []

    return (
        <>
            <div className="shrink-0 border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-300 items-center justify-center gap-0.5 overflow-x-auto px-3 py-2 lg:px-10">
                    {ALPHABET.split('').map(letter => {
                        const hasItems = Boolean(groupedByLetter[letter]?.length)
                        const isActive = activeLetter === letter
                        return (
                            <button
                                key={letter}
                                type="button"
                                disabled={!hasItems}
                                onMouseEnter={e => hasItems && showLetter(letter, e.currentTarget)}
                                onFocus={e => hasItems && showLetter(letter, e.currentTarget)}
                                onMouseLeave={scheduleHide}
                                onBlur={scheduleHide}
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-medium transition-colors ${
                                    isActive
                                        ? 'bg-blue-600 text-white'
                                        : hasItems
                                            ? 'text-slate-600 hover:bg-slate-100'
                                            : 'text-[var(--outline)]'
                                }`}
                                aria-label={letter}
                            >
                                {letter}
                            </button>
                        )
                    })}
                </div>
            </div>

            {hoveredLetter && letterPos && hoveredItems.length > 0 && createPortal(
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
                        {hoveredItems.map(item => {
                            const active = item.key === activeKey
                            return (
                                <li key={item.key}>
                                    <Link
                                        href={item.href}
                                        aria-current={active ? 'page' : undefined}
                                        className={`block rounded-md px-2.5 py-1.5 text-sm leading-5 transition-colors ${active ? 'bg-blue-50 font-semibold text-blue-700' : 'font-medium text-slate-700 hover:bg-[var(--surface-high)]'}`}
                                    >
                                        <span className="block truncate">{item.label}</span>
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </div>,
                document.body,
            )}
        </>
    )
}
