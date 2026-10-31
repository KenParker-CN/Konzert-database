'use client'

import {useMemo} from 'react'

type SpotifyKind = 'artist' | 'album' | 'track' | 'playlist'

interface SpotifyEmbedProps {
    /** Spotify URI (e.g. `spotify:artist:4Z8W4fKeB5YxbusRsdQVPb`) or open.spotify.com URL. */
    uri?: string
    className?: string
}

function parseSpotify(uri: string): {kind: SpotifyKind; id: string} | null {
    const trimmed = uri.trim()
    const uriMatch = /^spotify:(artist|album|track|playlist):([a-zA-Z0-9]{22,})$/.exec(trimmed)
    if (uriMatch) return {kind: uriMatch[1] as SpotifyKind, id: uriMatch[2]}

    const urlMatch = /^https?:\/\/open\.spotify\.com\/(artist|album|track|playlist)\/([a-zA-Z0-9]{22,})/.exec(trimmed)
    if (urlMatch) return {kind: urlMatch[1] as SpotifyKind, id: urlMatch[2]}

    return null
}

export default function SpotifyEmbed({uri, className}: SpotifyEmbedProps) {
    const resolved = useMemo(() => (uri ? parseSpotify(uri) : null), [uri])
    if (!resolved) return null

    const {kind, id} = resolved
    const src = `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator`

    return (
        <section
            className={className}
            aria-label={`Spotify ${kind}`}
        >
            <div className="flex flex-col gap-2">
                <iframe
                    src={src}
                    width="100%"
                    height="352"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allow="encrypted-media"
                    sandbox="allow-scripts allow-same-origin allow-popups"
                    title={`Spotify ${kind}`}
                    className="w-full min-h-[352px] aspect-video rounded-xl border border-slate-200 bg-slate-50 shadow-sm"
                />
            </div>
        </section>
    )
}
