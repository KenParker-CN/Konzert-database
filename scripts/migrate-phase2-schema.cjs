/**
 * Phase 2 schema migration (idempotent — safe to re-run).
 *
 * Implements the audited and agreed schema changes:
 *   A. artists.artist_category TEXT NOT NULL DEFAULT 'classical'
 *   B. Missing UNIQUE constraints / reverse indexes (incl. the recording_works
 *      NULL-movement duplicate hole, fixed with a COALESCE expression index).
 *   C. catalogues + catalogue_entries, populated by parsing works.catalog_no
 *      ("RV 315" -> catalogue RV, entry 315). works.catalog_no is KEPT as a
 *      read-only display/compat field; catalogue_entries is the new authority.
 *   E. musicbrainz_id external-ID columns on artists / works / recordings / tracklists.
 *
 * Explicitly NOT done here (deferred as "D" — separate, riskier migration):
 *   - albums.csv -> tracklists migration and retirement of the recordings 1-26
 *     release-shadow rows (FK chain via tracklist_entries.recording_id=16).
 *
 * Run: node scripts/migrate-phase2-schema.cjs
 */
const Database = require('better-sqlite3')
const fs = require('fs')
const os = require('os')
const path = require('path')

const ROOT = 'D:/Users/Parker/WebstormProjects/parker-home'
const DB = path.join(ROOT, 'identifier.sqlite')

// ---- safety backup (outside the repo, keeps git status clean) ----
const stamp = new Date().toISOString().replace(/[:.T-]/g, '').slice(0, 14)
const backupPath = path.join(os.tmpdir(), `identifier.sqlite.backup-phase2-${stamp}`)
fs.copyFileSync(DB, backupPath)
console.log('backup:', backupPath)

const db = new Database(DB)
db.pragma('foreign_keys = ON')

const tableExists = n => !!db.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?`).get(n)
const colExists = (t, c) => db.pragma(`table_info(${t})`).some(x => x.name === c)
const idxExists = n => !!db.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?`).get(n)

let parseSkipped = []

db.transaction(() => {
  // ---------- A. artist_category ----------
  if (!colExists('artists', 'artist_category')) {
    db.exec(`ALTER TABLE artists ADD COLUMN artist_category TEXT NOT NULL DEFAULT 'classical'`)
    console.log('A: added artists.artist_category')
  } else console.log('A: artists.artist_category already present')

  // ---------- E. musicbrainz_id columns ----------
  for (const t of ['artists', 'works', 'recordings', 'tracklists']) {
    if (!colExists(t, 'musicbrainz_id')) {
      db.exec(`ALTER TABLE ${t} ADD COLUMN musicbrainz_id TEXT`)
      console.log(`E: added ${t}.musicbrainz_id`)
    } else console.log(`E: ${t}.musicbrainz_id already present`)
  }

  // ---------- C. catalogues / catalogue_entries ----------
  if (!tableExists('catalogues')) {
    db.exec(`CREATE TABLE catalogues (
      catalogue_id  INTEGER PRIMARY KEY AUTOINCREMENT,
      code          TEXT NOT NULL UNIQUE,
      name          TEXT,
      created_at    TEXT DEFAULT (datetime('now', 'localtime'))
    )`)
    console.log('C: created catalogues')
  }
  if (!tableExists('catalogue_entries')) {
    db.exec(`CREATE TABLE catalogue_entries (
      entry_id      INTEGER PRIMARY KEY AUTOINCREMENT,
      catalogue_id  INTEGER NOT NULL,
      work_id       INTEGER NOT NULL,
      entry_no      TEXT NOT NULL,                -- "315", "540a" — text: catalogues use letters too
      UNIQUE (catalogue_id, entry_no),
      UNIQUE (catalogue_id, work_id),
      FOREIGN KEY (catalogue_id) REFERENCES catalogues(catalogue_id) ON DELETE CASCADE,
      FOREIGN KEY (work_id)      REFERENCES works(work_id)      ON DELETE CASCADE
    )`)
    console.log('C: created catalogue_entries')
  }

  const catNames = { KV: 'Köchel-Verzeichnis', RV: 'Ryom-Verzeichnis' }
  const insCatalogue = db.prepare(`INSERT OR IGNORE INTO catalogues (code, name) VALUES (?, ?)`)
  const getCatalogue = db.prepare(`SELECT catalogue_id FROM catalogues WHERE code = ?`)
  const insertEntry = db.prepare(`INSERT OR IGNORE INTO catalogue_entries (catalogue_id, work_id, entry_no) VALUES (?, ?, ?)`)

  const workRows = db.prepare(`SELECT work_id, catalog_no FROM works WHERE catalog_no IS NOT NULL AND catalog_no <> ''`).all()
  let insertedEntries = 0
  for (const w of workRows) {
    const m = /^([A-Za-z][A-Za-z0-9]*)\s+(.+?)\s*$/.exec(w.catalog_no)
    if (!m) { parseSkipped.push({ work_id: w.work_id, catalog_no: w.catalog_no }); continue }
    const code = m[1].toUpperCase()
    insCatalogue.run(code, catNames[code] ?? null)
    const cat = getCatalogue.get(code)
    const info = insertEntry.run(cat.catalogue_id, w.work_id, m[2])
    insertedEntries += info.changes
  }
  console.log(`C: parsed ${workRows.length - parseSkipped.length}/${workRows.length} catalog_no values, new entries: ${insertedEntries}`)
  if (parseSkipped.length) console.log('C: SKIPPED (no "PREFIX number" pattern):', JSON.stringify(parseSkipped))

  // ---------- B. indexes / constraints ----------
  const indexes = [
    // duplicate prevention (incl. the NULL-movement PK hole proven in the audit)
    [`ux_recording_works_rec_work_movement`, `CREATE UNIQUE INDEX ux_recording_works_rec_work_movement ON recording_works(recording_id, work_id, COALESCE(movement, ''))`],
    [`ux_work_composers_primary`,            `CREATE UNIQUE INDEX ux_work_composers_primary ON work_composers(work_id) WHERE is_primary = 1`],
    [`ux_works_catalog_no`,                  `CREATE UNIQUE INDEX ux_works_catalog_no ON works(catalog_no)`],
    [`ux_tracklists_title`,                  `CREATE UNIQUE INDEX ux_tracklists_title ON tracklists(title)`],
    // reverse-lookup indexes used by the data layer
    [`idx_work_composers_artist`,            `CREATE INDEX idx_work_composers_artist ON work_composers(artist_id)`],
    [`idx_work_interpreters_artist`,         `CREATE INDEX idx_work_interpreters_artist ON work_interpreters(artist_id)`],
    [`idx_recording_works_work`,             `CREATE INDEX idx_recording_works_work ON recording_works(work_id)`],
    [`idx_catalogue_entries_work`,           `CREATE INDEX idx_catalogue_entries_work ON catalogue_entries(work_id)`],
    // external IDs (UNIQUE treats NULLs as distinct)
    [`ux_artists_musicbrainz`,               `CREATE UNIQUE INDEX ux_artists_musicbrainz ON artists(musicbrainz_id)`],
    [`ux_works_musicbrainz`,                 `CREATE UNIQUE INDEX ux_works_musicbrainz ON works(musicbrainz_id)`],
    [`ux_recordings_musicbrainz`,            `CREATE UNIQUE INDEX ux_recordings_musicbrainz ON recordings(musicbrainz_id)`],
    [`ux_tracklists_musicbrainz`,            `CREATE UNIQUE INDEX ux_tracklists_musicbrainz ON tracklists(musicbrainz_id)`],
  ]
  for (const [name, sql] of indexes) {
    if (idxExists(name)) { console.log(`B: ${name} already present`); continue }
    db.exec(sql)
    console.log(`B: created ${name}`)
  }

  // ---------- E (data enrichment): seed tracklists.musicbrainz_id from albums.csv ----------
  const csvPath = path.join(ROOT, 'public/data/albums.csv')
  if (fs.existsSync(csvPath)) {
    const text = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '')
    const lines = text.split('\n').filter(l => l.trim())
    for (const line of lines.slice(1)) {
      // crude CSV split is safe here: no quoted commas inside the first three columns
      const cols = line.split(',')
      const mbid = (cols[1] ?? '').trim()
      const title = (cols[2] ?? '').trim()
      if (!mbid || !title) continue
      const updated = db.prepare(
        `UPDATE tracklists SET musicbrainz_id = ? WHERE title = ? AND musicbrainz_id IS NULL`,
      ).run(mbid, title)
      if (updated.changes) console.log(`E: seeded tracklists.musicbrainz_id for "${title}"`)
    }
  }
})()

// ---------- verification ----------
console.log('\n===== verification =====')
console.log('integrity_check:', db.pragma('integrity_check', { simple: true }))
console.log('foreign_key_check:', JSON.stringify(db.pragma('foreign_key_check')))

const counts = {}
for (const t of ['artists', 'works', 'work_composers', 'work_interpreters', 'artist_roles', 'group_members',
  'recordings', 'recording_performers', 'recording_works', 'tracklists', 'tracklist_entries', 'catalogues', 'catalogue_entries']) {
  counts[t] = db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c
}
console.log('row counts:', JSON.stringify(counts))

console.log('artist_category values:', JSON.stringify(db.prepare(`SELECT artist_category, COUNT(*) c FROM artists GROUP BY artist_category`).all()))
console.log('primary-composer violations (must be 0):', db.prepare(`SELECT COUNT(*) c FROM (SELECT work_id FROM work_composers WHERE is_primary = 1 GROUP BY work_id HAVING COUNT(*) > 1)`).get().c)
console.log('is_primary=0 rows:', db.prepare(`SELECT COUNT(*) c FROM work_composers WHERE is_primary = 0`).get().c)
console.log('catalogues:', JSON.stringify(db.prepare(`SELECT code, name FROM catalogues ORDER BY code`).all()))
console.log('entries per catalogue:', JSON.stringify(db.prepare(`SELECT c.code, COUNT(*) n FROM catalogue_entries ce JOIN catalogues c ON c.catalogue_id = ce.catalogue_id GROUP BY c.code`).all()))

db.close()
console.log('\nDONE')
