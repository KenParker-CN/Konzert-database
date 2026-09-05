import type {ReleaseTracklist} from '@/lib/db/recordings'
import MarqueeText from '@/components/common/MarqueeText'

/**
 * Pure presentational tracklist panel (no hooks, no i18n calls).
 * All labels are injected so the same component can be rendered from the
 * client dialog and directly from server components (tests, SSR).
 */
export type TracklistLabels = {
    tracklist: string
    tracklistUnavailable: string
    recordingInfo: string
    recordingTitle: string
    recordingDate: string
    performers: string
    relatedWorks: string
    disc: string
}

export function formatDuration(seconds: number | null): string | null {
    if (seconds === null || seconds <= 0) return null
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export default function TracklistPanel({tracklist, expandedId, onToggle, labels}: {
    tracklist: ReleaseTracklist | null
    expandedId: number | null
    onToggle: (entryId: number) => void
    labels: TracklistLabels
}) {
    const tracks = tracklist?.tracks ?? []
    return (
        <div className="flex w-full min-h-0 flex-col rounded-xl border border-slate-200 bg-slate-50 p-4">
            {!tracks.length ? (
                <p className="mt-3 text-sm text-slate-500">{labels.tracklistUnavailable}</p>
            ) : (
                <ol className="mt-1 min-w-0 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:scrollbar-thin">
                    {tracks.map((track, index) => {
                        const previous = index > 0 ? tracks[index - 1] : null
                        const showDisc = track.discNumber !== null
                            && (index === 0 || previous?.discNumber !== track.discNumber)
                        const expanded = expandedId === track.entryId
                        const duration = formatDuration(track.durationSeconds)
                        return (
                            <li key={track.entryId} className="relative">
                                {showDisc && (
                                    <p className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                        {labels.disc.replace('{number}', String(track.discNumber))}
                                    </p>
                                )}
                                <button type="button" onClick={() => onToggle(track.entryId)}
                                        aria-expanded={expanded}
                                        className="flex min-w-0 w-full items-baseline gap-2 rounded-lg px-1.5 py-1 text-left text-[10px] hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100">
                                    <span className="w-4 shrink-0 text-[9px] font-semibold tabular-nums text-slate-400">
                                        {String(track.trackNumber).padStart(2, '0')}
                                    </span>
                                    <MarqueeText className="min-w-0 flex-1 text-slate-700">{track.recordingTitle}</MarqueeText>
                                    <span className="shrink-0 text-[9px] tabular-nums text-slate-500">{duration ?? '—'}</span>
                                </button>
                                {expanded && (
                                    <div className="absolute left-0 right-0 z-10 mt-0.5 rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-lg">
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{labels.recordingInfo}</p>
                                        <dl className="mt-1.5 space-y-1.5">
                                            <div>
                                                <dt className="text-[10px] text-slate-400">{labels.recordingTitle}</dt>
                                                <dd className="text-slate-700">{track.recordingTitle}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] text-slate-400">{labels.recordingDate}</dt>
                                                <dd className="text-slate-700">{track.recordingDate ?? '—'}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] text-slate-400">{labels.performers}</dt>
                                                <dd className="text-slate-700">
                                                    {track.performers.length
                                                        ? <ul className="space-y-0.5">
                                                            {track.performers.map((performer, performerIndex) => (
                                                                <li key={performerIndex}>
                                                                    {performer.artistName} · {performer.performanceRole}
                                                                    {performer.instrument ? ` · ${performer.instrument}` : ''}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        : '—'}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] text-slate-400">{labels.relatedWorks}</dt>
                                                <dd className="text-slate-700">
                                                    {track.works.length
                                                        ? <ul className="space-y-0.5">
                                                            {track.works.map(work => (
                                                                <li key={work.workId}>
                                                                    <span className="font-medium">{work.workTitle}</span>
                                                                    {work.catalogNo && <span className="text-slate-500"> · {work.catalogNo}</span>}
                                                                    {work.movement && <span className="block pl-3 text-slate-500">{work.movement}</span>}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        : '—'}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                )}
                            </li>
                        )
                    })}
                </ol>
            )}
        </div>
    )
}
