import type {GenreCsvEntry} from '@/lib/data/csv-loader'
import {getGenrePath} from '@/lib/data/genre-v2'
import {localePath, type Locale} from '@/lib/i18n/config'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'
import {IconArrowUpRight} from '@tabler/icons-react'
import Link from 'next/link'

export default function GenreCard({locale, entry}: {locale: Locale; entry: GenreCsvEntry}) {
    return (
        <Link
            href={localePath(locale, getGenrePath(entry))}
            className="group flex min-h-20 items-center justify-between gap-4 border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
        >
            <span className="heading text-base font-semibold text-slate-900">{getLocalizedWorkTerm(entry.name, 'type', locale)}</span>
            <IconArrowUpRight size={18} className="shrink-0 text-slate-400 transition group-hover:text-blue-600" aria-hidden="true"/>
        </Link>
    )
}
