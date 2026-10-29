import type {Locale} from '@/lib/i18n/config'

const WIKIPEDIA_SITES: Record<Locale, string> = {
    en: 'enwiki',
    zh: 'zhwiki',
    de: 'dewiki',
    fr: 'frwiki',
}

type WikidataEntityResponse = {
    entities?: Record<string, {
        sitelinks?: Record<string, {title?: string}>
    }>
}

type WikipediaResponse = {
    query?: {
        pages?: Array<{
            title?: string
            extract?: string
            missing?: boolean
        }>
    }
}

export type WikipediaIntroduction = {
    title: string
    extract: string
    url: string
}

export async function getWikipediaIntroduction(wikiID: string, locale: Locale, signal?: AbortSignal): Promise<WikipediaIntroduction | null> {
    if (!/^Q\d+$/.test(wikiID)) return null

    try {
        const entityUrl = new URL('https://www.wikidata.org/w/api.php')
        entityUrl.search = new URLSearchParams({
            action: 'wbgetentities',
            ids: wikiID,
            props: 'sitelinks',
            format: 'json',
            origin: '*',
        }).toString()
        const entityResponse = await fetch(entityUrl, {signal})
        if (!entityResponse.ok) return null

        const entityData = await entityResponse.json() as WikidataEntityResponse
        const sitelinks = entityData.entities?.[wikiID]?.sitelinks
        const localizedSite = WIKIPEDIA_SITES[locale]
        const sites = localizedSite === 'enwiki' ? ['enwiki'] : [localizedSite, 'enwiki']

        for (const site of sites) {
            const title = sitelinks?.[site]?.title
            if (!title) continue

            const language = site.slice(0, -4)
            const apiUrl = new URL(`https://${language}.wikipedia.org/w/api.php`)
            apiUrl.search = new URLSearchParams({
                action: 'query',
                prop: 'extracts',
                exintro: '1',
                explaintext: '1',
                format: 'json',
                formatversion: '2',
                origin: '*',
                titles: title,
            }).toString()

            try {
                const articleResponse = await fetch(apiUrl, {signal})
                if (!articleResponse.ok) continue

                const articleData = await articleResponse.json() as WikipediaResponse
                const page = articleData.query?.pages?.[0]
                if (!page?.extract || page.missing) continue

                return {
                    title: page.title || title,
                    extract: page.extract,
                    url: `https://${language}.wikipedia.org/wiki/${encodeURIComponent((page.title || title).replaceAll(' ', '_'))}`,
                }
            } catch {
                if (signal?.aborted) return null
            }
        }

        return null
    } catch {
        return null
    }
}
