'use client'

import {useEffect, useState} from 'react'
import type {WikiBannerItem} from '@/lib/db/composers'

const ROTATE_INTERVAL_MS = 6000

export default function WikiRandomBanner({
    items,
    title,
    kindLabels,
}: {
    items: WikiBannerItem[]
    title: string
    kindLabels: Record<WikiBannerItem['kind'], string>
}) {
    const [active, setActive] = useState(0)
    const [paused, setPaused] = useState(false)

    useEffect(() => {
        if (paused || items.length < 2) return
        const timer = window.setInterval(() => setActive(index => (index + 1) % items.length), ROTATE_INTERVAL_MS)
        return () => window.clearInterval(timer)
    }, [paused, items.length])

    return (
        <aside
            className="flex w-full flex-col border border-slate-200 bg-[color-mix(in_srgb,var(--surface-container)_80%,transparent)] p-5 shadow-sm"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
        >
            <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">{title}</p>
                <div className="flex items-center gap-1.5">
                    {items.map((item, index) => (
                        <button
                            key={item.kind}
                            type="button"
                            aria-label={kindLabels[item.kind]}
                            aria-current={index === active}
                            onClick={() => setActive(index)}
                            className={`h-1.5 w-6 transition-colors ${index === active ? 'bg-blue-600' : 'bg-[var(--outline)] hover:bg-[var(--on-surface-muted)]'}`}
                        />
                    ))}
                </div>
            </div>
            <div className="mt-4 grid flex-1 content-center">
                {items.map((item, index) => (
                    <WikiBannerCard
                        key={item.kind}
                        item={item}
                        kindLabel={kindLabels[item.kind]}
                        visible={index === active}
                    />
                ))}
            </div>
        </aside>
    )
}

function WikiBannerCard({
    item,
    kindLabel,
    visible,
}: {
    item: WikiBannerItem
    kindLabel: string
    visible: boolean
}) {
    const {introduction} = item
    const summary = introduction?.extract.split(/\n+/).find(Boolean)

    return (
        <div
            inert={!visible}
            className={`col-start-1 row-start-1 transition-opacity duration-500 ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        >
            <div className="flex gap-4">
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--on-surface-muted)]">{kindLabel}</p>
                    <a href={item.href} className="mt-1 block text-lg font-semibold tracking-tight text-[var(--on-surface)] hover:text-[var(--primary)]">
                        {item.title}
                    </a>
                    {item.subtitle && <p className="mt-0.5 text-xs text-[var(--on-surface-muted)]">{item.subtitle}</p>}
                    {summary && <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--on-surface-muted)]">{summary}</p>}
                    {introduction && (
                        <a
                            href={introduction.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-xs text-[var(--on-surface-muted)] underline decoration-[var(--outline)] underline-offset-2 hover:text-[var(--on-surface)]"
                        >
                            {introduction.title} — Wikipedia
                        </a>
                    )}
                </div>
                {introduction?.imageUrl && (
                    <img
                        src={introduction.imageUrl}
                        alt={introduction.title}
                        loading="lazy"
                        className="h-28 w-28 shrink-0 object-cover"
                    />
                )}
            </div>
        </div>
    )
}
