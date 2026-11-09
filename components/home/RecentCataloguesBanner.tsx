'use client'

import {useEffect, useState} from 'react'
import Link from 'next/link'

const ROTATE_INTERVAL_MS = 6000

export type RecentCatalogueBannerItem = {
    href: string
    title: string
    subtitle: string
    countLabel: string
}

export default function RecentCataloguesBanner({
    items,
    title,
}: {
    items: RecentCatalogueBannerItem[]
    title: string
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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{title}</p>
                <div className="flex items-center gap-1.5">
                    {items.map((item, index) => (
                        <button
                            key={item.href}
                            type="button"
                            aria-label={item.title}
                            aria-current={index === active}
                            onClick={() => setActive(index)}
                            className={`h-1.5 w-6 transition-colors ${index === active ? 'bg-blue-600' : 'bg-[var(--outline)] hover:bg-[var(--on-surface-muted)]'}`}
                        />
                    ))}
                </div>
            </div>
            <div className="mt-4 grid flex-1 content-center">
                {items.map((item, index) => (
                    <div
                        key={item.href}
                        inert={index !== active}
                        className={`col-start-1 row-start-1 transition-opacity duration-500 ${index === active ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                    >
                        <Link href={item.href} className="block">
                            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--on-surface-muted)]">
                                {item.subtitle}
                            </span>
                            <span className="mt-1 block text-lg font-semibold tracking-tight text-[var(--on-surface)] hover:text-[var(--primary)]">
                                {item.title}
                            </span>
                            <span className="mt-2 block text-sm text-[var(--on-surface-muted)]">{item.countLabel}</span>
                        </Link>
                    </div>
                ))}
            </div>
        </aside>
    )
}
