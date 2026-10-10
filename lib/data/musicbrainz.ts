import 'server-only'

const MUSICBRAINZ_API = 'https://musicbrainz.org/ws/2'
const MUSICBRAINZ_USER_AGENT = 'Konzert-database/1.0 (https://github.com/KenParker-CN/Konzert-database)'
const MUSICBRAINZ_CACHE_SECONDS = 24 * 60 * 60
const MUSICBRAINZ_PAGE_SIZE = 100

export type MusicBrainzWork = {
    id: string
    title: string
    type: string
    disambiguation: string
}

export type MusicBrainzWorksResult = {
    artistId: string
    works: MusicBrainzWork[]
    total: number
}

export class MusicBrainzError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options)
        this.name = 'MusicBrainzError'
    }
}

let lastRequestAt = 0
let requestQueue: Promise<void> = Promise.resolve()
const pendingRequests = new Map<string, Promise<unknown>>()

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

async function requestJson(url: string): Promise<unknown> {
    const pending = pendingRequests.get(url)
    if (pending) return pending

    let releaseQueue!: () => void
    const previousRequest = requestQueue
    requestQueue = new Promise<void>(resolve => {
        releaseQueue = resolve
    })

    const request = (async () => {
        await previousRequest
        try {
            const wait = Math.max(0, 1000 - (Date.now() - lastRequestAt))
            if (wait) await new Promise(resolve => setTimeout(resolve, wait))
            lastRequestAt = Date.now()

            const response = await fetch(url, {
                headers: {
                    Accept: 'application/json',
                    'User-Agent': MUSICBRAINZ_USER_AGENT,
                },
                next: {revalidate: MUSICBRAINZ_CACHE_SECONDS},
            })
            if (!response.ok) {
                throw new MusicBrainzError(`MusicBrainz request failed with status ${response.status}`)
            }
            return await response.json() as unknown
        } catch (error) {
            if (error instanceof MusicBrainzError) throw error
            throw new MusicBrainzError('Unable to fetch MusicBrainz data', {cause: error})
        } finally {
            pendingRequests.delete(url)
            releaseQueue()
        }
    })()

    pendingRequests.set(url, request)
    return request
}

function normalizeName(value: string): string {
    return value.normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[‐‑‒–—]/g, '-')
        .toLocaleLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
}

export async function getMusicBrainzWorksForComposer(
    composerName: string,
    birthDate: string | null,
): Promise<MusicBrainzWorksResult | null> {
    const params = new URLSearchParams({
        query: `artist:"${composerName.replace(/([\\"])/g, '\\$1')}"`,
        fmt: 'json',
        limit: '25',
    })
    const searchData = await requestJson(`${MUSICBRAINZ_API}/artist/?${params}`)
    if (!isRecord(searchData) || !Array.isArray(searchData.artists)) {
        throw new MusicBrainzError('MusicBrainz returned an invalid artist search response')
    }

    const birthYear = birthDate?.match(/\b\d{4}\b/)?.[0]
    const matchingArtists = searchData.artists.filter((artist): artist is Record<string, unknown> =>
        isRecord(artist)
        && typeof artist.id === 'string'
        && typeof artist.name === 'string'
        && normalizeName(artist.name) === normalizeName(composerName),
    )
    matchingArtists.sort((first, second) => {
        const firstLifeSpan = isRecord(first['life-span']) ? first['life-span'] : {}
        const secondLifeSpan = isRecord(second['life-span']) ? second['life-span'] : {}
        const firstBirthMatches = birthYear && firstLifeSpan.begin?.toString().startsWith(birthYear)
        const secondBirthMatches = birthYear && secondLifeSpan.begin?.toString().startsWith(birthYear)
        if (firstBirthMatches !== secondBirthMatches) return firstBirthMatches ? -1 : 1
        return Number(second.score ?? 0) - Number(first.score ?? 0)
    })

    const artistId = matchingArtists[0]?.id
    if (typeof artistId !== 'string') return null

    const workParams = new URLSearchParams({
        artist: artistId,
        fmt: 'json',
        limit: String(MUSICBRAINZ_PAGE_SIZE),
        offset: '0',
    })
    const worksData = await requestJson(`${MUSICBRAINZ_API}/work/?${workParams}`)
    if (!isRecord(worksData) || !Array.isArray(worksData.works)) {
        throw new MusicBrainzError('MusicBrainz returned an invalid works response')
    }

    const works = worksData.works.flatMap((work): MusicBrainzWork[] => {
        if (
            !isRecord(work)
            || typeof work.id !== 'string'
            || typeof work.title !== 'string'
            || typeof work.type !== 'string'
            || !work.type.trim()
        ) return []
        return [{
            id: work.id,
            title: work.title,
            type: work.type,
            disambiguation: typeof work.disambiguation === 'string' ? work.disambiguation : '',
        }]
    })

    return {
        artistId,
        works,
        total: typeof worksData['work-count'] === 'number' ? worksData['work-count'] : works.length,
    }
}
