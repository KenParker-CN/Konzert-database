import WorksTable from '@/app/[locale]/composers/WorksTable'
import {getCatalogWorksSafe} from '@/lib/db/composers'
import {getI18n} from '@/lib/i18n/server'

export default async function CatalogWorksPanel({
    locale,
    catalogCode,
}: {
    locale: string
    catalogCode: string
}) {
    const [{works, error}, {t}] = await Promise.all([
        getCatalogWorksSafe(catalogCode),
        getI18n(locale),
    ])

    return (
        <section className="mt-8">
            <div className="mb-3">
                <h2 className="heading text-2xl font-semibold">{t('works.title')}</h2>
            </div>
            {error ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center text-sm text-amber-800">
                    {t('works.loadFailed')}
                </div>
            ) : works.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <WorksTable works={works} catalogCode={catalogCode}/>
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
                    {t('works.noWorks')}
                </div>
            )}
        </section>
    )
}
