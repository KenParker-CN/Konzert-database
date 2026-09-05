import AppShell from '@/components/AppShell'
import PageHeader from '@/components/PageHeader'
import ArtistDirectory from './ArtistDirectory'
import { getArtists, getArtistCategories } from '@/lib/db/artists'
import { getI18n } from '@/lib/i18n/server'
import { isLocale } from '@/lib/i18n/config'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function ArtistsPage({ params, searchParams }: {
    params: Promise<{ locale: string }>
    searchParams: SearchParams
}) {
    const { locale } = await params
    if (!isLocale(locale)) notFound()

    const query = await searchParams
    const search = Array.isArray(query.search) ? query.search[0] : query.search
    const category = Array.isArray(query.category) ? query.category[0] : query.category
    const { t } = await getI18n(locale)

    const artists = await getArtists(search ?? '', category ?? '')
    const categories = await getArtistCategories()

    return <AppShell active="artists"><main className="min-h-screen"><div className="mx-auto max-w-[1440px] px-5 py-10 lg:px-10 lg:py-14"><PageHeader badge={t('artists.badge')} title={t('artists.title')} description={t('artists.description')} /><ArtistDirectory artists={artists} search={search ?? ''} categories={categories} selectedCategory={category ?? ''} /></div></main></AppShell>
}