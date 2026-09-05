const Database = require('better-sqlite3');
const db = new Database('identifier.sqlite');

console.log('=== Step 1: Rename tracklists to releases ===');
db.exec(`
  ALTER TABLE tracklists RENAME TO releases;
  ALTER TABLE tracklist_entries RENAME COLUMN tracklist_id TO release_id;
`);
console.log('  Renamed: tracklists → releases, tracklist_id → release_id');

console.log('\n=== Step 2: Add FK columns to releases ===');
db.exec(`
  ALTER TABLE releases ADD COLUMN composer_id INTEGER REFERENCES artists(artist_id);
  ALTER TABLE releases ADD COLUMN artist_id INTEGER REFERENCES artists(artist_id);
`);
console.log('  Added: composer_id, artist_id');

console.log('\n=== Step 3: Map album titles to composer/artist IDs ===');
// Based on albums.csv data
const mappings = [
  { title: 'Positions (Deluxe)', composer: null, artist: 6 }, // Ariana Grande
  { title: 'eternal sunshine deluxe: brighter days ahead', composer: null, artist: 6 },
  { title: 'choke enough', composer: null, artist: null },
  { title: "Suite d'un goût étranger", composer: 15, artist: null }, // Marin Marais
  { title: 'The Leipzig Collegium Musicum Vol. 1: Music before Bach', composer: 5, artist: null }, // Telemann
  { title: 'Concert for the Prince of Poland', composer: 2, artist: null }, // Vivaldi
  { title: 'Sonatas for Violin and Fortepiano', composer: 14, artist: null }, // CPE Bach
  { title: 'Concerti', composer: 3, artist: null }, // JS Bach
  { title: 'The Golden Hour', composer: 18, artist: null }, // Leclair
  { title: 'Concerti per due violini', composer: 2, artist: null }, // Vivaldi
  { title: 'Concerto for 2 Pianos / Concerto for Flute and Harp / Horn Concerto, K447', composer: 1, artist: null }, // Mozart
  { title: 'Le quattro stagioni', composer: 2, artist: null }, // Vivaldi
  { title: 'Specchio veneziano', composer: 17, artist: null }, // Rebel
  { title: "La mer / Images / Prélude à l'après-midi d'un faune", composer: 12, artist: null }, // Debussy
  { title: 'Platée', composer: 13, artist: null }, // Rameau
  { title: 'Une Symphonie Imaginaire', composer: 13, artist: null }, // Rameau
  { title: '6 String Quintets on Historical Instruments', composer: 1, artist: null }, // Mozart
  { title: 'MAGDALENE', composer: null, artist: null },
  { title: 'Eusexua', composer: null, artist: null },
  { title: 'Ouvertures-Suites', composer: 3, artist: null }, // JS Bach
  { title: 'Concerto veneziano', composer: 2, artist: null }, // Vivaldi
  { title: 'Concerti per una vita', composer: 2, artist: null }, // Vivaldi
  { title: 'Holberg Suite · 2 Elegiac Melodies / Serenade for Strings', composer: 10, artist: null }, // Grieg
];

const updateRelease = db.prepare('UPDATE releases SET composer_id = ?, artist_id = ? WHERE title = ?');
for (const m of mappings) {
  const result = updateRelease.run(m.composer, m.artist, m.title);
  if (result.changes === 0) {
    console.log(`  WARNING: No match for "${m.title}"`);
  }
}
console.log('  Updated composer_id/artist_id for all releases');

console.log('\n=== Step 4: Insert missing "petal" recording ===');
const insertRec = db.prepare('INSERT INTO recordings (title, duration_seconds) VALUES (?, ?)');
const petalRec = insertRec.run('petal', 184); // 3:04 = 184s
const petalRecId = petalRec.lastInsertRowid;
console.log(`  Inserted "petal" recording with ID ${petalRecId}`);

console.log('\n=== Step 5: Clear and rebuild tracklist_entries ===');
db.exec('DELETE FROM tracklist_entries');
console.log('  Cleared existing entries');

const insertEntry = db.prepare('INSERT INTO tracklist_entries (release_id, recording_id, disc_number, track_number) VALUES (?, ?, ?, ?)');

// petal (release_id = 1): 12 tracks
const petalTracks = [
  { rec: 27, track: 1 },  // kiss me
  { rec: 28, track: 2 },  // hate that i made you love me
  { rec: petalRecId, track: 3 },  // petal
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
  { rec: 38, disc: 1, track: 1 },  // K. 207 I
  { rec: 39, disc: 1, track: 2 },  // K. 207 II
  { rec: 40, disc: 1, track: 3 },  // K. 207 III
  { rec: 41, disc: 1, track: 4 },  // K. 211 I
  { rec: 42, disc: 1, track: 5 },  // K. 211 II
  { rec: 43, disc: 1, track: 6 },  // K. 211 III
  { rec: 44, disc: 1, track: 7 },  // K. 216 I
  { rec: 45, disc: 1, track: 8 },  // K. 216 II
  { rec: 46, disc: 1, track: 9 },  // K. 216 III
  // Disc 2
  { rec: 47, disc: 2, track: 1 },  // K. 218 I
  { rec: 48, disc: 2, track: 2 },  // K. 218 II
  { rec: 49, disc: 2, track: 3 },  // K. 218 III
  { rec: 50, disc: 2, track: 4 },  // K. 219 I
  { rec: 51, disc: 2, track: 5 },  // K. 219 II
  { rec: 52, disc: 2, track: 6 },  // K. 219 III
];

for (const t of mozartTracks) {
  insertEntry.run(2, t.rec, t.disc, t.track);
}
console.log(`  Inserted ${mozartTracks.length} Mozart tracks (2 discs)`);

console.log('\n=== Step 6: Verification ===');
const finalEntries = db.prepare(`
  SELECT r.title as release_title, te.disc_number, te.track_number, rec.title as recording_title, rec.duration_seconds
  FROM tracklist_entries te
  JOIN releases r ON r.release_id = te.release_id
  JOIN recordings rec ON rec.recording_id = te.recording_id
  ORDER BY r.release_id, te.disc_number, te.track_number
`).all();

console.log('  Total entries: ' + finalEntries.length);
finalEntries.forEach(e => {
  console.log(`    ${e.release_title?.slice(0, 30)} | D${e.disc_number}T${e.track_number} | ${e.recording_title?.slice(0, 40)} | ${e.duration_seconds}s`);
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
  console.log(`  ${r.release_id}: ${r.title?.slice(0, 35)} | composer=${r.composer || '—'} | artist=${r.artist || '—'}`);
});

// Integrity check
console.log('\n=== Integrity Check ===');
const integrity = db.prepare('PRAGMA integrity_check').get();
console.log('  ' + integrity.integrity_check);

const fkCheck = db.prepare('PRAGMA foreign_key_check').all();
console.log('  FK violations: ' + fkCheck.length);

db.close();
console.log('\nDone.');
