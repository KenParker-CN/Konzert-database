import GenreIntroduction from '@/components/genres/GenreIntroduction'
import InstrumentBreadcrumb from '@/components/instruments/InstrumentBreadcrumb'
import type {Locale} from '@/lib/i18n/config'

export default function GenreDetail({locale, entry, crumbs}: {
    locale: Locale
    entry: {name: string; inCategory?: string; typeOf?: string; wikiQID?: string}
    crumbs: {label: string; href?: string}[]
}) {
    return (
        <div className="mx-auto max-w-300 px-5 py-8 lg:px-10 lg:py-10">
            <InstrumentBreadcrumb items={crumbs}/>
            <header className="mb-8">
                <h1 className="heading mt-2 text-3xl font-semibold tracking-tight text-slate-950">{entry.name}</h1>
                <p className="mt-2 text-sm font-medium text-slate-600">{entry.inCategory}{entry.typeOf ? ` / ${entry.typeOf}` : ''}</p>
            </header>
            <GenreIntroduction wikiID={entry.wikiQID} locale={locale}/>
        </div>
    )
}
