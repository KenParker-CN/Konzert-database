import AppShell from '@/components/AppShell'
import PageHeader from '@/components/PageHeader'
import ComposerDirectory from './ComposerDirectory'
import { getComposers } from '@/lib/db/composers'
import { getI18n } from '@/lib/i18n/server'
import { isLocale } from '@/lib/i18n/config'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function ComposersPage({ params, searchParams }: {
    params: Promise<{ locale: string }>
    searchParams: SearchParams
}) {
    const { locale } = await params
    if (!isLocale(locale)) notFound()

    const query = await searchParams
    const search = Array.isArray(query.search) ? query.search[0] : query.search
    const composers = await getComposers(search ?? '')
    const { t } = await getI18n(locale)

    return <AppShell active="composers">
        <main className="min-h-screen">
            <div className="mx-auto max-w-360 px-5 py-10 lg:px-10 lg:py-14">
                <PageHeader
                    badge={t('composers.badge')}
                    title={t('composers.title')}
                    description={t('composers.description')}
                />
                <ComposerDirectory
                    composers={composers}
                    search={search ?? ''}
                />
            </div>
        </main>
    </AppShell>
}
