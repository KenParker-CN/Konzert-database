const Database = require('better-sqlite3');
const db = new Database('identifier.sqlite');

// Fix: releases table PK should be release_id, not tracklist_id
console.log('=== Fix: Rename releases.tracklist_id to release_id ===');
db.exec(`
  BEGIN;
  
  CREATE TABLE releases_new (
    release_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT,
    release_date TEXT,
    label TEXT,
    catalog_number TEXT,
    created_at TEXT,
    musicbrainz_id TEXT,
    cover_dlink TEXT,
    strmlk_spo TEXT,
    strmlk_apple TEXT,
    strmlk_tid TEXT,
    genre TEXT,
    composer_id INTEGER REFERENCES artists(artist_id),
    artist_id INTEGER REFERENCES artists(artist_id)
  );
  
  INSERT INTO releases_new 
  SELECT tracklist_id, title, type, release_date, label, catalog_number, created_at,
         musicbrainz_id, cover_dlink, strmlk_spo, strmlk_apple, strmlk_tid, genre,
         composer_id, artist_id
  FROM releases;
  
  DROP TABLE releases;
  ALTER TABLE releases_new RENAME TO releases;
  
  COMMIT;
`);
console.log('  Fixed: releases PK is now release_id');

console.log('\n=== Verification ===');
const finalEntries = db.prepare(`
  SELECT r.title as release_title, te.disc_number, te.track_number, rec.title as recording_title, rec.duration_seconds
  FROM tracklist_entries te
  JOIN releases r ON r.release_id = te.release_id
  JOIN recordings rec ON rec.recording_id = te.recording_id
  ORDER BY r.release_id, te.disc_number, te.track_number
`).all();

console.log('  Total entries: ' + finalEntries.length);
finalEntries.forEach(e => {
  console.log(`    ${e.release_title?.slice(0, 35)} | D${e.disc_number}T${e.track_number} | ${e.recording_title?.slice(0, 45)} | ${e.duration_seconds}s`);
});

console.log('\n=== Releases with composer/artist ===');
const releases = db.prepare(`
  SELECT r.release_id, r.title, r.composer_id, a1.name as composer, r.artist_id, a2.name as artist
  FROM releases r
  LEFT JOIN artists a1 ON a1.artist_id = r.composer_id
  LEFT JOIN artists a2 ON a2.artist_id = r.artist_id
  ORDER BY r.release_id
`).all();
releases.forEach(r => {
  console.log(`  ${r.release_id}: ${r.title?.slice(0, 40)} | composer=${r.composer || '—'} | artist=${r.artist || '—'}`);
});

console.log('\n=== Integrity Check ===');
const integrity = db.prepare('PRAGMA integrity_check').get();
console.log('  ' + integrity.integrity_check);

const fkCheck = db.prepare('PRAGMA foreign_key_check').all();
console.log('  FK violations: ' + fkCheck.length);

db.close();
console.log('\nDone.');
