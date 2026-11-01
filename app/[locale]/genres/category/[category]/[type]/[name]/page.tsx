import AppShell from '@/components/AppShell'
import GenreDetail from '@/components/genres/GenreDetail'
import {getGenreCsvEntries} from '@/lib/data/csv-loader'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function GenreNamePage({params}: {params: Promise<{locale: string; category: string; type: string; name: string}>}) {
    const {locale, category, type, name} = await params
    if (!isLocale(locale)) notFound()

    const entries = await getGenreCsvEntries()
    const decodedCategory = decodeURIComponent(category)
    const decodedType = decodeURIComponent(type)
    const decodedName = decodeURIComponent(name)
    const entry = entries.find(e => e.name === decodedName)

    if (!entry) notFound()

    const {t} = await getI18n(locale)

    return (
        <AppShell active="genres">
            <main className="min-h-[calc(100dvh-4rem)]">
                <GenreDetail locale={locale} entry={entry} crumbs={[
                    {label: t('navigation.genres'), href: localePath(locale, '/genres')},
                    {label: decodedCategory, href: localePath(locale, `/genres/category/${encodeURIComponent(decodedCategory)}`)},
                    ...(decodedType === 'Other' ? [] : [{label: decodedType, href: localePath(locale, `/genres/category/${encodeURIComponent(decodedCategory)}/${encodeURIComponent(decodedType)}`)}]),
                    {label: entry.name},
                ]}/>
            </main>
        </AppShell>
    )
}
