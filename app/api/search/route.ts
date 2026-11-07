import {searchArchive} from '@/lib/db/search'
import {defaultLocale, isLocale} from '@/lib/i18n/config'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')?.trim() ?? ''
    if (!query) return Response.json({results: []})

    const requestedLocale = url.searchParams.get('locale') ?? ''
    const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale

    try {
        const results = await searchArchive(query, locale)
        return Response.json(results)
    } catch (error) {
        console.error('[search] Failed to load results:', error)
        return Response.json({error: 'Search unavailable'}, {status: 500})
    }
}
