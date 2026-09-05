const Database = require('better-sqlite3');
const db = new Database('identifier.sqlite');

// Step 1: Drop and recreate tracklist_entries with correct FK
console.log('=== Step 1: Fix tracklist_entries FK ===');
db.exec(`
  BEGIN;
  
  CREATE TABLE tracklist_entries_new (
    entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
    release_id INTEGER NOT NULL REFERENCES releases(release_id),
    recording_id INTEGER NOT NULL REFERENCES recordings(recording_id),
    disc_number INTEGER NOT NULL DEFAULT 1,
    track_number INTEGER NOT NULL,
    side TEXT
  );
  
  DROP TABLE tracklist_entries;
  ALTER TABLE tracklist_entries_new RENAME TO tracklist_entries;
  
  COMMIT;
`);
console.log('  Fixed: tracklist_entries now references releases(release_id)');

// Step 2: Re-insert petal and Mozart tracks
console.log('\n=== Step 2: Insert tracklist entries ===');
const insertEntry = db.prepare('INSERT INTO tracklist_entries (release_id, recording_id, disc_number, track_number) VALUES (?, ?, ?, ?)');

// petal (release_id = 1): 12 tracks
const petalTracks = [
  { rec: 27, track: 1 },  // kiss me
  { rec: 28, track: 2 },  // hate that i made you love me
  { rec: 53, track: 3 },  // petal (newly inserted)
  { rec: 29, track: 4 },  // stay
  { rec: 30, track: 5 },  // oh well
  { rec: 31, track: 6 },  // big feelings
  { rec: 32, track: 7 },  // freak
  { rec: 33, track: 8 },  // warning signs (interlude)
  { rec: 34, track: 9 },  // like i do
  { rec: 35, track: 10 }, // never get over me
  { rec: 36, track: 11 }, // bad thing (bunny hop)
  { rec: 37, track: 12 }, // nowhere, nobody
];

for (const t of petalTracks) {
  insertEntry.run(1, t.rec, 1, t.track);
}
console.log(`  Inserted ${petalTracks.length} petal tracks`);

// Mozart's Violin (release_id = 2): 15 tracks, 2 discs
const mozartTracks = [
  // Disc 1
  { rec: 38, disc: 1, track: 1 },
  { rec: 39, disc: 1, track: 2 },
  { rec: 40, disc: 1, track: 3 },
  { rec: 41, disc: 1, track: 4 },
  { rec: 42, disc: 1, track: 5 },
  { rec: 43, disc: 1, track: 6 },
  { rec: 44, disc: 1, track: 7 },
  { rec: 45, disc: 1, track: 8 },
  { rec: 46, disc: 1, track: 9 },
  // Disc 2
  { rec: 47, disc: 2, track: 1 },
  { rec: 48, disc: 2, track: 2 },
  { rec: 49, disc: 2, track: 3 },
  { rec: 50, disc: 2, track: 4 },
  { rec: 51, disc: 2, track: 5 },
  { rec: 52, disc: 2, track: 6 },
];

for (const t of mozartTracks) {
  insertEntry.run(2, t.rec, t.disc, t.track);
}
console.log(`  Inserted ${mozartTracks.length} Mozart tracks (2 discs)`);

// Step 3: Verify
console.log('\n=== Step 3: Verification ===');
const finalEntries = db.prepare(`
  SELECT r.title as release_title, te.disc_number, te.track_number, rec.title as recording_title, rec.duration_seconds
  FROM tracklist_entries te
  JOIN releases r ON r.release_id = te.release_id
  JOIN recordings rec ON rec.recording_id = te.recording_id
  ORDER BY r.release_id, te.disc_number, te.track_number
`).all();

console.log('  Total entries: ' + finalEntries.length);
finalEntries.forEach(e => {
  console.log(`    ${e.release_title?.slice(0, 40)} | D${e.disc_number}T${e.track_number} | ${e.recording_title?.slice(0, 50)} | ${e.duration_seconds}s`);
});

// Integrity
console.log('\n=== Integrity ===');
console.log('  ' + db.prepare('PRAGMA integrity_check').get().integrity_check);
console.log('  FK violations: ' + db.prepare('PRAGMA foreign_key_check').all().length);

db.close();
console.log('\nDone.');
