import {searchArchive} from '@/lib/db/search'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')?.trim() ?? ''
    if (!query) return Response.json({results: []})

    try {
        const results = await searchArchive(query, {catalogueLimit: 3, workLimit: 5})
        return Response.json(results)
    } catch (error) {
        console.error('[search] Failed to load results:', error)
        return Response.json({error: 'Search unavailable'}, {status: 500})
    }
}
