'use client'

import {useEffect, useState} from 'react'
import {getWikipediaIntroduction, type WikipediaIntroduction} from '@/lib/data/wikipedia'
import {useI18n} from '@/lib/i18n/client'
import type {Locale} from '@/lib/i18n/config'

type IntroductionBlock = {kind: 'heading'; text: string; id: string} | {kind: 'paragraph'; text: string}

function toBlocks(extract: string): IntroductionBlock[] {
    const usedIds = new Map<string, number>()
    return extract.split(/\n+/).map(line => line.trim()).filter(Boolean).map((line): IntroductionBlock => {
        const heading = /^=+\s*(.*?)\s*=+$/.exec(line)
        if (!heading) return {kind: 'paragraph', text: line}
        const text = heading[1]
        const base = text.replace(/\s+/g, '_')
        const seen = usedIds.get(base) ?? 0
        usedIds.set(base, seen + 1)
        return {kind: 'heading', text, id: seen ? `${base}_${seen + 1}` : base}
    })
}

export default function GenreIntroduction({
    wikiID,
    locale,
    variant = 'page',
}: {
    wikiID?: string
    locale: Locale
    variant?: 'page' | 'dialog'
}) {
    const compact = variant === 'dialog'
    const {t} = useI18n()
    const [introduction, setIntroduction] = useState<WikipediaIntroduction | null>(null)
    const [loading, setLoading] = useState(Boolean(wikiID))
    const [expanded, setExpanded] = useState(false)
    const [scrolledDown, setScrolledDown] = useState(false)
    const [activeId, setActiveId] = useState<string | null>(null)
    const extract = introduction?.extract ?? ''

    useEffect(() => {
        const updateScrolled = () => setScrolledDown(window.scrollY > 400)
        updateScrolled()
        window.addEventListener('scroll', updateScrolled, {passive: true})
        return () => window.removeEventListener('scroll', updateScrolled)
    }, [])

    useEffect(() => {
        if (compact || !expanded) return
        const elements = toBlocks(extract)
            .flatMap(block => block.kind === 'heading' ? [document.getElementById(block.id)] : [])
            .filter((element): element is HTMLElement => Boolean(element))
        if (elements.length === 0) return

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) setActiveId(entry.target.id)
            })
        }, {rootMargin: '-96px 0px -60% 0px'})
        elements.forEach(element => observer.observe(element))
        return () => observer.disconnect()
    }, [compact, expanded, extract])

    useEffect(() => {
        if (!wikiID) {
            setIntroduction(null)
            setLoading(false)
            return
        }

        const controller = new AbortController()
        setLoading(true)
        getWikipediaIntroduction(wikiID, locale, controller.signal).then(result => {
            if (controller.signal.aborted) return
            setIntroduction(result)
            setLoading(false)
        })
        return () => controller.abort()
    }, [locale, wikiID])

    if (loading) {
        return (
            <div className={compact ? 'space-y-2' : 'mt-5 animate-pulse space-y-3'} aria-label="Loading introduction" aria-busy="true">
                <div className={`h-4 w-full rounded bg-slate-200 ${compact ? 'h-3' : ''}`}/>
                <div className={`h-4 w-full rounded bg-slate-200 ${compact ? 'h-3' : ''}`}/>
                <div className={`h-4 w-4/5 rounded bg-slate-200 ${compact ? 'h-3' : ''}`}/>
            </div>
        )
    }

    if (!introduction) return null

    const blocks = toBlocks(introduction.extract)
    const firstParagraphIndex = blocks.findIndex(block => block.kind === 'paragraph')
    const leadBlocks = blocks.slice(0, firstParagraphIndex + 1)
    const showAll = !compact && expanded
    const visibleBlocks = showAll ? blocks : leadBlocks
    const headingBlocks = blocks.filter((block): block is Extract<IntroductionBlock, {kind: 'heading'}> => block.kind === 'heading')
    const canExpand = !compact && blocks.length > leadBlocks.length

    return (
        <div className={compact ? undefined : 'mt-5 flow-root'}>
            {!compact && introduction.imageUrl && (
                <img
                    src={introduction.imageUrl}
                    alt={introduction.title}
                    loading="lazy"
                    className="float-right mb-3 ml-5 w-40 rounded-xl border border-slate-200 bg-white object-cover shadow-sm sm:w-52"
                />
            )}
            {visibleBlocks.map((block, index) => block.kind === 'heading' ? (
                <h3 key={index} id={block.id} className="heading group mt-6 scroll-mt-24 text-lg font-semibold text-slate-900 first:mt-0">
                    {block.text}
                    <a href={`#${block.id}`} className="ml-2 text-slate-300 opacity-0 transition hover:text-blue-700 focus-visible:opacity-100 group-hover:opacity-100">#</a>
                </h3>
            ) : (
                <p key={index} className={compact ? 'text-sm leading-5 text-slate-700' : 'mt-4 text-base leading-8 text-slate-600 first:mt-0'}>{block.text}</p>
            ))}
            {canExpand && (
                <button
                    type="button"
                    onClick={() => setExpanded(value => !value)}
                    className="mt-4 text-sm font-medium text-blue-700 hover:underline"
                >
                    {expanded ? t('composers.collapseIntroduction') : t('composers.showFullIntroduction')}
                </button>
            )}
            <p className={compact ? 'mt-1.5 text-right text-xs' : 'mt-2 text-right text-xs'}>
                <a
                    href={introduction.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-700"
                >
                    {introduction.title} — Wikipedia
                </a>
            </p>
            {showAll && scrolledDown && headingBlocks.length > 0 && (
                <nav
                    aria-label="Sections"
                    className="fixed right-3 top-28 z-30 hidden max-h-[calc(100vh-8rem)] w-44 overflow-y-auto rounded-xl border border-slate-200 bg-white/95 p-3 text-sm shadow-sm backdrop-blur xl:block"
                >
                    <ul className="space-y-1.5">
                        {headingBlocks.map(block => (
                            <li key={block.id}>
                                <a
                                    href={`#${block.id}`}
                                    title={block.text}
                                    aria-current={activeId === block.id ? 'location' : undefined}
                                    className={`line-clamp-2 block border-l-2 pl-2 transition ${activeId === block.id ? 'border-blue-700 font-medium text-blue-700' : 'border-transparent text-slate-600 hover:text-blue-700'}`}
                                >
                                    {block.text}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            )}
            {showAll && scrolledDown && (
                <button
                    type="button"
                    onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
                    aria-label={t('composers.backToTop')}
                    title={t('composers.backToTop')}
                    className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:border-blue-300 hover:text-blue-700"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                        <path d="m18 15-6-6-6 6"/>
                    </svg>
                </button>
            )}
        </div>
    )
}
