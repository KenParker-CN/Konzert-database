'use client'

import {useEffect, useMemo, useState} from 'react'
import Link from 'next/link'
import {Popover} from '@base-ui/react/popover'

export type AlphabetIndexItem = {key: string; sortName: string; label: string; href: string}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const IDLE_HIDE_DELAY_MS = 900

function getSortInitial(name: string): string {
    const trimmed = name.trim()
    if (!trimmed) return '#'
    const first = trimmed[0].toUpperCase()
    return ALPHABET.includes(first) ? first : '#'
}

export default function AlphabetIndex({
    items,
    activeKey,
    variant = 'top',
}: {
    items: AlphabetIndexItem[]
    activeKey: string
    variant?: 'top' | 'side'
}) {
    const isSide = variant === 'side'
    const [sideVisible, setSideVisible] = useState(false)

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
        if (!isSide) return
        let idleTimer: ReturnType<typeof setTimeout> | undefined
        const onScroll = () => {
            setSideVisible(true)
            clearTimeout(idleTimer)
            idleTimer = setTimeout(() => setSideVisible(false), IDLE_HIDE_DELAY_MS)
        }
        document.addEventListener('scroll', onScroll, {capture: true, passive: true})
        return () => {
            document.removeEventListener('scroll', onScroll, {capture: true})
            clearTimeout(idleTimer)
        }
    }, [isSide])

    const letterButtons = ALPHABET.split('').map(letter => {
        const letterItems = groupedByLetter[letter] ?? []
        const hasItems = letterItems.length > 0
        if (isSide && !hasItems) return null
        const isActive = activeLetter === letter
        const state = isActive
            ? 'bg-blue-600 text-white'
            : hasItems
                ? isSide
                    ? 'text-slate-600 hover:bg-[var(--primary-container)] hover:text-blue-600'
                    : 'text-slate-600 hover:bg-slate-100'
                : 'text-[var(--outline)]'
        const base = isSide
            ? 'inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold transition-colors'
            : 'flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-medium transition-colors'
        return (
            <Popover.Root key={letter}>
                <Popover.Trigger
                    openOnHover
                    delay={0}
                    closeDelay={150}
                    disabled={!hasItems}
                    className={`${base} ${state}`}
                    aria-label={letter}
                >
                    {letter}
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Positioner side={isSide ? 'right' : 'bottom'} align="start" sideOffset={8} className="z-[100]">
                        <Popover.Popup className="w-64 rounded-lg border border-slate-200 bg-white shadow-xl outline-none">
                            <Popover.Arrow className="size-2.5 rotate-45 bg-inherit data-[side=bottom]:-top-[5px] data-[side=left]:-right-[5px] data-[side=right]:-left-[5px] data-[side=top]:-bottom-[5px]"/>
                            <div className="px-3 pb-1 pt-2 text-xs font-semibold text-slate-400">
                                {letter}
                            </div>
                            <ul className="always-visible-scrollbar flex max-h-80 flex-col gap-0.5 overflow-y-auto p-2 pt-0">
                                {letterItems.map(item => {
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
                        </Popover.Popup>
                    </Popover.Positioner>
                </Popover.Portal>
            </Popover.Root>
        )
    })

    if (isSide) {
        return (
            <nav
                onMouseEnter={() => setSideVisible(true)}
                onMouseLeave={() => setSideVisible(false)}
                className={`absolute right-2 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-0.5 rounded-full border border-slate-200 bg-[color-mix(in_srgb,var(--surface-container)_90%,transparent)] px-1 py-2 text-xs shadow-md backdrop-blur transition-opacity duration-300 ${sideVisible ? 'opacity-100' : 'opacity-0'}`}
            >
                {letterButtons}
            </nav>
        )
    }

    return (
        <div className="shrink-0 border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-300 items-center justify-center gap-0.5 overflow-x-auto px-3 py-2 lg:px-10">
                {letterButtons}
            </div>
        </div>
    )
}
