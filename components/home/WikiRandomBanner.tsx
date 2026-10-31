'use client'

import {useEffect, useState} from 'react'
import {getWikipediaIntroduction, type WikipediaIntroduction} from '@/lib/data/wikipedia'
import type {WikiBannerItem} from '@/lib/db/composers'
import type {Locale} from '@/lib/i18n/config'

const ROTATE_INTERVAL_MS = 6000

export default function WikiRandomBanner({
    items,
    locale,
    title,
    kindLabels,
}: {
    items: WikiBannerItem[]
    locale: Locale
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
            className="w-full border border-slate-200 bg-white/80 p-5 shadow-sm"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
        >
            <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">{title}</p>
                <div className="flex items-center gap-1.5">
                    {items.map((item, index) => (
                        <button
                            key={item.kind}
                            type="button"
                            aria-label={kindLabels[item.kind]}
                            aria-current={index === active}
                            onClick={() => setActive(index)}
                            className={`h-1.5 w-6 transition-colors ${index === active ? 'bg-blue-600' : 'bg-slate-300 hover:bg-slate-400'}`}
                        />
                    ))}
                </div>
            </div>
            <div className="mt-4 grid">
                {items.map((item, index) => (
                    <WikiBannerCard
                        key={item.kind}
                        item={item}
                        locale={locale}
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
    locale,
    kindLabel,
    visible,
}: {
    item: WikiBannerItem
    locale: Locale
    kindLabel: string
    visible: boolean
}) {
    const [introduction, setIntroduction] = useState<WikipediaIntroduction | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const controller = new AbortController()
        getWikipediaIntroduction(item.wikiID, locale, controller.signal).then(result => {
            if (controller.signal.aborted) return
            setIntroduction(result)
            setLoading(false)
        })
        return () => controller.abort()
    }, [item.wikiID, locale])

    const summary = introduction?.extract.split(/\n+/).find(Boolean)

    return (
        <div
            inert={!visible}
            className={`col-start-1 row-start-1 transition-opacity duration-500 ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{kindLabel}</p>
            <a href={item.href} className="mt-1 block text-lg font-semibold tracking-tight text-slate-950 hover:text-blue-600">
                {item.title}
            </a>
            {item.subtitle && <p className="mt-0.5 text-xs text-slate-500">{item.subtitle}</p>}
            {loading ? (
                <div className="mt-2 animate-pulse space-y-1.5" aria-busy="true">
                    <div className="h-3 w-full rounded bg-slate-200"/>
                    <div className="h-3 w-4/5 rounded bg-slate-200"/>
                </div>
            ) : summary ? (
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{summary}</p>
            ) : null}
            {introduction && (
                <a
                    href={introduction.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-700"
                >
                    {introduction.title} — Wikipedia
                </a>
            )}
        </div>
    )
}
