const TTL_MS = 24 * 60 * 60 * 1000
const TIMEOUT_MS = 5000
const MAX_HTML_BYTES = 64 * 1024

const cache = new Map<string, {title: string | null; expiresAt: number}>()

const ENTITIES: Record<string, string> = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'"}

function decodeEntities(text: string) {
    return text.replace(/&(#39|amp|lt|gt|quot|apos);/g, (_, name: string) => ENTITIES[name])
}

export async function getPageTitle(url: string): Promise<string | null> {
    const cached = cache.get(url)
    if (cached && cached.expiresAt > Date.now()) return cached.title

    let title: string | null = null
    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(TIMEOUT_MS),
            headers: {'User-Agent': 'Mozilla/5.0 (compatible; KonzertDatabase/1.0)'},
        })
        if (response.ok) {
            const html = (await response.text()).slice(0, MAX_HTML_BYTES)
            const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)
            const cleaned = match ? decodeEntities(match[1].replace(/\s+/g, ' ').trim()) : ''
            title = cleaned || null
        }
    } catch {
        title = null
    }

    cache.set(url, {title, expiresAt: Date.now() + TTL_MS})
    return title
}
