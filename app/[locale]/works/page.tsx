import WorkExplorer from './WorkExplorer'
import AppShell from '../../../components/AppShell'
import PageHeader from '../../../components/PageHeader'
import { getWorkFilterOptions, getWorks, type WorkFilters } from '../../../lib/db/works'
import { getI18n } from '../../../lib/i18n/server'
import { isLocale } from '../../../lib/i18n/config'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function value(input: string | string[] | undefined) {
    return Array.isArray(input) ? input[0] : input
}

export default async function WorksPage({
                                            params,
                                            searchParams,
                                        }: {
    params: Promise<{ locale: string }>
    searchParams: SearchParams
}) {
    const { locale } = await params
    if (!isLocale(locale)) notFound()

    const query = await searchParams

    const filters: WorkFilters = {
        search: value(query.search),
        catalogue: value(query.catalogue),
        type: value(query.type),
        key: value(query.key),
        instrumentation: value(query.instrumentation),
    }

    const [works, options] = await Promise.all([
        getWorks(filters),
        getWorkFilterOptions(),
    ])

    const { t } = await getI18n(locale)

    return (
        <AppShell active="works">
            <main className="min-h-screen">
                <div className="mx-auto max-w-[1440px] px-5 py-10 lg:px-10 lg:py-14">
                    <PageHeader
                        badge={t('works.badge')}
                        title={t('works.title')}
                        description={t('works.description')}
                    />

                    <WorkExplorer
                        works={works}
                        options={options}
                    />
                </div>
            </main>
        </AppShell>
    )
}