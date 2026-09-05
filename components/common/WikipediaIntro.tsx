'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/client'

interface WikipediaIntroProps {
    name: string
}

const wikipediaLanguageMap: Record<string, string> = {
    en: 'en',
    de: 'de',
    fr: 'fr',
    ja: 'ja',
    zh: 'zh',
}

export default function WikipediaIntro({ name }: WikipediaIntroProps) {
    const [intro, setIntro] = useState('')
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(true)
    const { t, locale } = useI18n()

    useEffect(() => {
        if (!name) return

        const fetchWikipedia = async () => {
            setLoading(true)

            const title = encodeURIComponent(name.replace(/‐/g, '-'))
            const wikiLanguage = wikipediaLanguageMap[locale] ?? 'en'

            const fetchSummary = async (language: string) => {
                const response = await fetch(
                    `https://${language}.wikipedia.org/api/rest_v1/page/summary/${title}`
                )

                if (!response.ok) {
                    throw new Error('Wikipedia page not found')
                }

                return response.json()
            }

            try {
                let data

                try {
                    // 先尝试当前网站语言
                    data = await fetchSummary(wikiLanguage)
                } catch {
                    // 当前语言没有对应页面时，fallback 到英语
                    if (wikiLanguage !== 'en') {
                        data = await fetchSummary('en')
                    } else {
                        throw new Error('Wikipedia page not found')
                    }
                }

                setIntro(data.extract ?? '')
                setUrl(data.content_urls?.desktop?.page ?? '')
            } catch {
                // 当前语言和英语都没有找到
                setIntro('')
                setUrl('')
            } finally {
                setLoading(false)
            }
        }

        fetchWikipedia()
    }, [name, locale])

    if (loading) {
        return (
            <div className="h-full">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    {t('artists.wikipedia')}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                    {t('artists.loadingIntroduction')}
                </p>
            </div>
        )
    }

    if (!intro) return null

    return (
        <div className="h-full">
            <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    {t('artists.wikipedia')}
                </p>

                {url && (
                    <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                        {t('artists.readOnWikipedia')}
                    </a>
                )}
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-600">
                {intro}
            </p>
        </div>
    )
}