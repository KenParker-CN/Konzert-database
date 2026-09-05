import AppShell from '../../../components/AppShell'
import PageHeader from '../../../components/PageHeader'
import AlbumGrid from './AlbumGrid'
import {getAlbums} from '../../../lib/db/albums'
import {getArtistSlugMap} from '../../../lib/db/artists'
import {getReleaseTracklists} from '../../../lib/db/recordings'
import {getI18n} from '../../../lib/i18n/server'
import {isLocale} from '../../../lib/i18n/config'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'
type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function AlbumsPage({params, searchParams}: {
    params: Promise<{ locale: string }>,
    searchParams: SearchParams
}) {
    const {locale} = await params
    if (!isLocale(locale)) notFound()
    const query = await searchParams
    const search = Array.isArray(query.search) ? query.search[0] : query.search
    const albums = getAlbums(search)
    const slugMap = getArtistSlugMap()
    const tracklists = getReleaseTracklists()
    const {t} = await getI18n(locale)
    return <AppShell active="albums">
        <main className="min-h-screen">
            <div className="mx-auto max-w-[1440px] px-5 py-10 lg:px-10 lg:py-14"><PageHeader
                badge={t('recordings.badge')}
                title={t('recordings.title')}
                description={t('recordings.description')}/><AlbumGrid
                albums={albums} search={search ?? ''} slugMap={slugMap} tracklists={tracklists}/></div>
        </main>
    </AppShell>
}
