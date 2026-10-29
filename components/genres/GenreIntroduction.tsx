'use client'

import {useEffect, useState} from 'react'
import {getWikipediaIntroduction, type WikipediaIntroduction} from '@/lib/data/wikipedia'
import type {Locale} from '@/lib/i18n/config'

export default function GenreIntroduction({
    wikiID,
    locale,
}: {
    wikiID?: string
    locale: Locale
}) {
    const [introduction, setIntroduction] = useState<WikipediaIntroduction | null>(null)
    const [loading, setLoading] = useState(Boolean(wikiID))

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
            <div className="mt-5 animate-pulse space-y-3" aria-label="Loading introduction" aria-busy="true">
                <div className="h-4 w-full rounded bg-slate-200"/>
                <div className="h-4 w-full rounded bg-slate-200"/>
                <div className="h-4 w-4/5 rounded bg-slate-200"/>
            </div>
        )
    }

    if (!introduction) return null

    const firstParagraph = introduction.extract.split(/\n+/).find(Boolean)

    return (
        <>
            <p className="mt-5 text-base leading-8 text-slate-600">{firstParagraph}</p>
            <p className="mt-2 text-right text-xs">
                <a
                    href={introduction.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-700"
                >
                    {introduction.title} — Wikipedia
                </a>
            </p>
        </>
    )
}
