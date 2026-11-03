'use client'

import {useEffect, useState} from 'react'
import {getWikipediaIntroduction, type WikipediaIntroduction} from '@/lib/data/wikipedia'
import {useI18n} from '@/lib/i18n/client'
import type {Locale} from '@/lib/i18n/config'

type IntroductionBlock = {kind: 'heading'; text: string} | {kind: 'paragraph'; text: string}

function toBlocks(extract: string): IntroductionBlock[] {
    return extract.split(/\n+/).map(line => line.trim()).filter(Boolean).map((line): IntroductionBlock => {
        const heading = /^=+\s*(.*?)\s*=+$/.exec(line)
        return heading ? {kind: 'heading', text: heading[1]} : {kind: 'paragraph', text: line}
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
                <h3 key={index} className="heading mt-6 text-lg font-semibold text-slate-900 first:mt-0">{block.text}</h3>
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
        </div>
    )
}
