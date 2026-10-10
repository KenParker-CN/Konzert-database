import WorksTable from '@/app/[locale]/composers/WorksTable'
import MusicBrainzWorks from '@/components/common/MusicBrainzWorks'
import {getComposerWorksSafe} from '@/lib/db/composers'
import {getMusicBrainzWorksForComposer, MusicBrainzError} from '@/lib/data/musicbrainz'
import {getI18n} from '@/lib/i18n/server'

export default async function ComposerWorksPanel({
    locale,
    artistId,
    catalogCode,
    composerName,
    startDate,
}: {
    locale: string
    artistId: number
    catalogCode: string | null
    composerName: string
    startDate: string | null
}) {
    const {t} = await getI18n(locale)

    if (catalogCode) {
        const {works, error} = await getComposerWorksSafe(artistId)

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
                        {t('composers.catalogueNotConnected')}
                    </div>
                )}
            </section>
        )
    }

    let musicBrainzResult = null
    let musicBrainzUnavailable = false
    try {
        musicBrainzResult = await getMusicBrainzWorksForComposer(composerName, startDate)
    } catch (error) {
        if (!(error instanceof MusicBrainzError)) throw error
        musicBrainzUnavailable = true
    }

    return (
        <section className="mt-8">
            <div className="mb-3">
                <h2 className="heading text-2xl font-semibold">{t('works.title')}</h2>
            </div>
            {musicBrainzResult ? (
                <MusicBrainzWorks result={musicBrainzResult} locale={locale}/>
            ) : musicBrainzUnavailable ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center text-sm text-amber-800">
                    {t('composers.musicBrainzUnavailable')}
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
                    {t('composers.musicBrainzArtistNotFound')}
                </div>
            )}
        </section>
    )
}
