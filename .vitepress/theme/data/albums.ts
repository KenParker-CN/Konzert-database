import { cataloguesByComposerSlug, catalogueLink } from './catalogues'
import { type Composer, composerLink, composers } from './composers'

export interface Album {
  id: string
  musicbrainz_id: string
  title: string
  composer: string[]
  artists: string[]
  label: string
  catalog_number: string
  year: string
  country: string
  genre: string
  barcode: string
  track_count: string
  cover: string
  spotify: string
  apple_music: string
  tidal: string
}

export type StreamingService =
    | 'spotify'
    | 'apple_music'
    | 'tidal'

export const streamingServices: {
  id: StreamingService
  label: string
  field: StreamingService
}[] = [
  {
    id: 'spotify',
    label: 'Spotify',
    field: 'spotify'
  },
  {
    id: 'apple_music',
    label: 'Apple Music',
    field: 'apple_music'
  },
  {
    id: 'tidal',
    label: 'Tidal',
    field: 'tidal'
  }
]

export function albumCollectionsLink(
    composerSlug?: string
): string {
  return composerSlug
      ? `/pages/albums?composer=${encodeURIComponent(composerSlug)}`
      : '/pages/albums'
}

export function normalizePersonName(
    name: string
): string {
  return name
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[‐-–—]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
}

function invertedComposerName(name: string): string {
  const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean)

  if (parts.length < 2) {
    return name
  }

  return `${parts[parts.length - 1]}, ${parts
      .slice(0, -1)
      .join(' ')}`
}

export function composerByName(
    name: string
): Composer | undefined {
  const normalized = normalizePersonName(name)

  if (!normalized) {
    return undefined
  }

  return composers.find(composer => {
    const full = normalizePersonName(composer.name)

    const inverted = normalizePersonName(
        invertedComposerName(composer.name)
    )

    return (
        full === normalized ||
        inverted === normalized
    )
  })
}

export function personHref(name: string): string {
  const composer = composerByName(name)

  return composer
      ? composerLink(composer)
      : ''
}

export function isClassicalAlbum(
    album: Album
): boolean {
  return album.composer.some(name =>
      Boolean(composerByName(name))
  )
}

export function displayComposers(
    album: Album
): string[] {
  if (!album.composer.length) {
    return []
  }

  if (isClassicalAlbum(album)) {
    return album.composer
  }

  if (album.artists.length) {
    return album.composer
  }

  return []
}

export function relatedCatalogueLinks(
    album: Album
): {
  id: string
  name: string
  href: string
}[] {
  const slugs = new Set(
      displayComposers(album)
          .map(name => composerByName(name)?.slug)
          .filter(
              (slug): slug is string =>
                  Boolean(slug)
          )
  )

  return [...slugs].flatMap(slug =>
      cataloguesByComposerSlug(slug).map(
          catalogue => ({
            id: catalogue.id,
            name: catalogue.name,
            href: catalogueLink(catalogue.id)
          })
      )
  )
}


/* =========================================
   Streaming
   ========================================= */

export function streamingUrl(
    album: Album,
    service: StreamingService
): string {
  return album[service].trim()
}


export function firstAvailableService(
    album: Album
): StreamingService | null {
  return (
      streamingServices.find(service =>
          Boolean(
              streamingUrl(album, service.id)
          )
      )?.id ?? null
  )
}


/* =========================================
   Streaming embed URLs
   ========================================= */

export function streamingEmbedSrc(
    service: StreamingService,
    url: string
): string | null {

  const raw = url.trim()

  if (!raw) {
    return null
  }

  try {
    const parsed = new URL(raw)


    /* -----------------------------------------
       Spotify
       ----------------------------------------- */

    if (service === 'spotify') {

      if (
          !parsed.hostname.includes(
              'spotify.com'
          )
      ) {
        return null
      }

      const path =
          parsed.pathname.replace(
              /^\/embed/,
              ''
          )

      if (
          !/^\/(album|track|playlist|episode|show)\//
              .test(path)
      ) {
        return null
      }

      return (
          `https://open.spotify.com/embed` +
          `${path}` +
          `${parsed.search}`
      )
    }


    /* -----------------------------------------
       Apple Music
       ----------------------------------------- */

    if (service === 'apple_music') {

      /*
       * Already an Apple Music embed URL.
       */
      if (
          parsed.hostname.includes(
              'embed.music.apple.com'
          )
      ) {
        return raw
      }

      /*
       * Normal Apple Music URL:
       *
       * https://music.apple.com/...
       */
      if (
          !parsed.hostname.includes(
              'music.apple.com'
          )
      ) {
        return null
      }

      return (
          `https://embed.music.apple.com` +
          `${parsed.pathname}` +
          `${parsed.search}`
      )
    }


    /* -----------------------------------------
       TIDAL
       ----------------------------------------- */

    if (service === 'tidal') {

      /*
       * Already an embed URL.
       *
       * https://embed.tidal.com/albums/90134054
       */
      if (
          parsed.hostname ===
          'embed.tidal.com'
      ) {
        return raw
      }

      /*
       * Normal TIDAL album URL:
       *
       * https://tidal.com/browse/album/90134054
       *
       * becomes:
       *
       * https://embed.tidal.com/albums/90134054
       */

      if (
          !parsed.hostname.includes(
              'tidal.com'
          )
      ) {
        return null
      }

      const albumMatch =
          parsed.pathname.match(
              /\/album\/([^/?]+)/
          )

      const albumId =
          albumMatch?.[1] ||
          parsed.searchParams.get('id')

      if (!albumId) {
        return null
      }

      return (
          `https://embed.tidal.com/albums/${albumId}`
      )
    }

  } catch {
    return null
  }

  return null
}