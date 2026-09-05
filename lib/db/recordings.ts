import 'server-only'

import { getDatabase } from './sqlite'

export type RecordingPerformer = {
    artistName: string
    performanceRole: string
    instrument: string | null
}

export type RecordingWorkLink = {
    workId: number
    workTitle: string
    catalogNo: string | null
    movement: string | null
    partNumber: number | null
}

export type TracklistTrack = {
    entryId: number
    discNumber: number | null
    trackNumber: number
    side: string | null
    recordingId: number
    recordingTitle: string
    durationSeconds: number | null
    recordingDate: string | null
    performers: RecordingPerformer[]
    works: RecordingWorkLink[]
}

export type ReleaseTracklist = {
    tracklistId: number
    title: string
    type?: string | null
    releaseDate: string | null
    label: string | null
    catalogNumber: string | null
    coverUrl?: string | null
    spotifyUrl?: string | null
    appleMusicUrl?: string | null
    tidalUrl?: string | null
    genre?: string | null
    tracks: TracklistTrack[]
}

export async function getReleaseTracklists(): Promise<Record<string, ReleaseTracklist>> {
    const db = getDatabase()
    try {
        const releasesResult = await db.execute(`
            SELECT release_id AS tracklistId, title, type, release_date AS releaseDate,
                   label, catalog_number AS catalogNumber,
                   cover_dlink AS coverUrl, strmlk_spo AS spotifyUrl, strmlk_apple AS appleMusicUrl, strmlk_tid AS tidalUrl, genre
            FROM releases
            ORDER BY release_id
        `)
        const releases = releasesResult.rows as unknown as Array<{ tracklistId: number; title: string; type: string | null; releaseDate: string | null; label: string | null; catalogNumber: string | null; coverUrl: string | null; spotifyUrl: string | null; appleMusicUrl: string | null; tidalUrl: string | null; genre: string | null }>

        const entriesResult = await db.execute(`
            SELECT e.entry_id AS entryId, e.release_id AS tracklistId, e.disc_number AS discNumber,
                   e.track_number AS trackNumber, e.side,
                   r.recording_id AS recordingId, r.title AS recordingTitle,
                   r.duration_seconds AS durationSeconds, r.recording_date AS recordingDate
            FROM tracklist_entries e
            JOIN recordings r ON r.recording_id = e.recording_id
            ORDER BY e.release_id, e.disc_number, e.track_number, e.entry_id
        `)
        const entries = entriesResult.rows as unknown as Array<{ entryId: number; tracklistId: number; discNumber: number | null; trackNumber: number; side: string | null; recordingId: number; recordingTitle: string; durationSeconds: number | null; recordingDate: string | null }>

        const performersResult = await db.execute(`
            SELECT rp.recording_id AS recordingId, rp.performance_role AS performanceRole, rp.instrument,
                   a.name AS artistName
            FROM recording_performers rp
            JOIN artists a ON a.artist_id = rp.artist_id
            ORDER BY rp.recording_id, rp.artist_id
        `)
        const performers = performersResult.rows as unknown as Array<{ recordingId: number; performanceRole: string; instrument: string | null; artistName: string }>

        const workLinksResult = await db.execute(`
            SELECT rw.recording_id AS recordingId, rw.movement, rw.part_number AS partNumber,
                   w.work_id AS workId, w.title AS workTitle, w.catalog_no AS catalogNo
            FROM recording_works rw
            JOIN works w ON w.work_id = rw.work_id
            ORDER BY rw.recording_id, rw.part_number, w.work_id
        `)
        const workLinks = workLinksResult.rows as unknown as Array<{ recordingId: number; movement: string | null; partNumber: number | null; workId: number; workTitle: string; catalogNo: string | null }>

        const performersByRecording = new Map<number, RecordingPerformer[]>()
        for (const row of performers) {
            const list = performersByRecording.get(row.recordingId) ?? []
            list.push({ artistName: row.artistName, performanceRole: row.performanceRole, instrument: row.instrument })
            performersByRecording.set(row.recordingId, list)
        }

        const worksByRecording = new Map<number, RecordingWorkLink[]>()
        for (const row of workLinks) {
            const list = worksByRecording.get(row.recordingId) ?? []
            list.push({ workId: row.workId, workTitle: row.workTitle, catalogNo: row.catalogNo, movement: row.movement, partNumber: row.partNumber })
            worksByRecording.set(row.recordingId, list)
        }

        const tracksByRelease = new Map<number, TracklistTrack[]>()
        for (const entry of entries) {
            const list = tracksByRelease.get(entry.tracklistId) ?? []
            list.push({
                entryId: entry.entryId,
                discNumber: entry.discNumber,
                trackNumber: entry.trackNumber,
                side: entry.side,
                recordingId: entry.recordingId,
                recordingTitle: entry.recordingTitle,
                durationSeconds: entry.durationSeconds,
                recordingDate: entry.recordingDate,
                performers: performersByRecording.get(entry.recordingId) ?? [],
                works: worksByRecording.get(entry.recordingId) ?? [],
            })
            tracksByRelease.set(entry.tracklistId, list)
        }

        const result: Record<string, ReleaseTracklist> = {}
        for (const release of releases) {
            result[release.title] = {
                tracklistId: release.tracklistId,
                title: release.title,
                type: release.type,
                releaseDate: release.releaseDate,
                label: release.label,
                catalogNumber: release.catalogNumber,
                coverUrl: release.coverUrl,
                spotifyUrl: release.spotifyUrl,
                appleMusicUrl: release.appleMusicUrl,
                tidalUrl: release.tidalUrl,
                genre: release.genre,
                tracks: tracksByRelease.get(release.tracklistId) ?? [],
            }
        }
        return result
    } catch (error) {
        console.error('getReleaseTracklists error:', error)
        return {}
    }
}
