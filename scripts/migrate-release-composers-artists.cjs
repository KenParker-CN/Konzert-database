/**
 * Migration: Support multiple composers/artists per release
 *
 * Creates junction tables release_composers and release_artists,
 * then populates them from the existing releases.composer_id and
 * releases.artist_id columns.
 *
 * Run: node scripts/migrate-release-composers-artists.cjs
 */
const Database = require('better-sqlite3')
const fs = require('fs')
const os = require('os')
const path = require('path')

const ROOT = 'D:/Users/Parker/WebstormProjects/parker-home'
const DB = path.join(ROOT, 'identifier.sqlite')

// ---- safety backup ----
const stamp = new Date().toISOString().replace(/[:.T-]/g, '').slice(0, 14)
const backupPath = path.join(os.tmpdir(), `identifier.sqlite.backup-release-migration-${stamp}`)
fs.copyFileSync(DB, backupPath)
console.log('backup:', backupPath)

const db = new Database(DB)
db.pragma('foreign_keys = ON')

const tableExists = n => !!db.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?`).get(n)

db.transaction(() => {
    // ---------- Create release_composers junction table ----------
    if (!tableExists('release_composers')) {
        db.exec(`
            CREATE TABLE release_composers (
                release_id  INTEGER NOT NULL REFERENCES releases(release_id) ON DELETE CASCADE,
                artist_id   INTEGER NOT NULL REFERENCES artists(artist_id) ON DELETE CASCADE,
                is_primary  INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (release_id, artist_id)
            )
        `)
        console.log('Created release_composers table')
    } else {
        console.log('release_composers table already exists')
    }

    // ---------- Create release_artists junction table ----------
    if (!tableExists('release_artists')) {
        db.exec(`
            CREATE TABLE release_artists (
                release_id      INTEGER NOT NULL REFERENCES releases(release_id) ON DELETE CASCADE,
                artist_id       INTEGER NOT NULL REFERENCES artists(artist_id) ON DELETE CASCADE,
                performance_role TEXT,
                instrument      TEXT,
                PRIMARY KEY (release_id, artist_id)
            )
        `)
        console.log('Created release_artists table')
    } else {
        console.log('release_artists table already exists')
    }

    // ---------- Populate release_composers from releases.composer_id ----------
    const releasesWithComposer = db.prepare(
        `SELECT release_id, composer_id FROM releases WHERE composer_id IS NOT NULL`
    ).all()

    const insertComposer = db.prepare(
        `INSERT OR IGNORE INTO release_composers (release_id, artist_id, is_primary) VALUES (?, ?, 1)`
    )
    for (const r of releasesWithComposer) {
        insertComposer.run(r.release_id, r.composer_id)
    }
    console.log(`Populated ${releasesWithComposer.length} composers into release_composers`)

    // ---------- Populate release_artists from releases.artist_id ----------
    const releasesWithArtist = db.prepare(
        `SELECT release_id, artist_id FROM releases WHERE artist_id IS NOT NULL`
    ).all()

    const insertArtist = db.prepare(
        `INSERT OR IGNORE INTO release_artists (release_id, artist_id) VALUES (?, ?)`
    )
    for (const r of releasesWithArtist) {
        insertArtist.run(r.release_id, r.artist_id)
    }
    console.log(`Populated ${releasesWithArtist.length} artists into release_artists`)
})()

// ---------- verification ----------
console.log('\n===== verification =====')
console.log('integrity_check:', db.pragma('integrity_check', { simple: true }))
console.log('foreign_key_check:', JSON.stringify(db.pragma('foreign_key_check')))

const counts = {}
for (const t of ['release_composers', 'release_artists']) {
    counts[t] = db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c
}
console.log('row counts:', JSON.stringify(counts))

console.log('\nrelease_composers sample:')
const sampleComposers = db.prepare(`
    SELECT rc.release_id, r.title, a.name, rc.is_primary
    FROM release_composers rc
    JOIN releases r ON r.release_id = rc.release_id
    JOIN artists a ON a.artist_id = rc.artist_id
    LIMIT 10
`).all()
sampleComposers.forEach(c => console.log(`  ${c.release_id}: ${c.title?.slice(0, 40)} | composer=${c.name} | primary=${c.is_primary}`))

console.log('\nrelease_artists sample:')
const sampleArtists = db.prepare(`
    SELECT ra.release_id, r.title, a.name, ra.performance_role, ra.instrument
    FROM release_artists ra
    JOIN releases r ON r.release_id = ra.release_id
    JOIN artists a ON a.artist_id = ra.artist_id
    LIMIT 10
`).all()
sampleArtists.forEach(a => console.log(`  ${a.release_id}: ${a.title?.slice(0, 40)} | artist=${a.name} | role=${a.performance_role || '—'} | instrument=${a.instrument || '—'}`))

db.close()
console.log('\nDONE')
