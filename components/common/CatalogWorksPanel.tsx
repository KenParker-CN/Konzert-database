import WorksAccordion from '@/components/catalogues/WorksAccordion'
import {getCatalogWorksSafe} from '@/lib/db/composers'
import {getI18n} from '@/lib/i18n/server'
import type {Locale} from '@/lib/i18n/config'

export default async function CatalogWorksPanel({
    locale,
    catalogCode,
}: {
    locale: Locale
    catalogCode: string
}) {
    const [{works, error}, {t}] = await Promise.all([
        getCatalogWorksSafe(catalogCode),
        getI18n(locale),
    ])

    return (
        <section className="min-w-0">
            {error ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center text-sm text-amber-800">
                    {t('works.loadFailed')}
                </div>
            ) : works.length > 0 ? (
                <WorksAccordion allWorks={works} catalogCode={catalogCode}/>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
                    {t('works.noWorks')}
                </div>
            )}
        </section>
    )
}
