import type {MusicBrainzWorksResult} from '@/lib/data/musicbrainz'
import {getI18n} from '@/lib/i18n/server'
import type {Locale} from '@/lib/i18n/config'

export default async function MusicBrainzWorks({result, locale}: {
    result: MusicBrainzWorksResult
    locale: Locale
}) {
    const {t} = await getI18n(locale)

    return <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-sm font-medium text-slate-700">
                {t('composers.musicBrainzCount', {shown: result.works.length, total: result.total})}
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500">{t('composers.musicBrainzAttribution')}</p>
                <a
                    href={`https://musicbrainz.org/artist/${result.artistId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                    {t('composers.musicBrainzOpen')}
                </a>
            </div>
        </div>
        {result.works.length > 0 ? (
            <ul className="divide-y divide-slate-100">
                {result.works.map(work => (
                    <li key={work.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                        <div className="min-w-0">
                            <p className="break-words text-sm font-medium text-slate-900">{work.title}</p>
                            {work.disambiguation && <p className="mt-1 text-xs text-slate-500">{work.disambiguation}</p>}
                        </div>
                        <div className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
                            {work.type && <span>{work.type}</span>}
                            <a
                                href={`https://musicbrainz.org/work/${work.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-blue-600 hover:text-blue-700"
                            >
                                MusicBrainz
                            </a>
                        </div>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="px-5 py-10 text-center text-sm text-slate-500">{t('composers.musicBrainzNoWorks')}</p>
        )}
    </div>
}
