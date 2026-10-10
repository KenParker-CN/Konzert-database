import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'KV-raw.json'), 'utf8'));

function esc(v) {
  if (v == null || v === '') return '';
  const s = String(v).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function lang(obj, code) {
  return obj?.lang?.[code] ?? '';
}

function personName(p) {
  return [p.firstName, p.addName, p.lastName, p.suffix]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fmtDate(y, m, d, aff) {
  if (!y || y === '0000' || y === '0') return '';
  const parts = [y];
  if (m && m !== '00') {
    parts.push(m);
    if (d && d !== '00') parts.push(d);
  }
  const base = parts.join('-');
  return aff ? `${base} (${aff})` : base;
}

const KV_EDITIONS = ['KV', 'KV1', 'KV2', 'KV3', 'KV3a', 'KV6'];

const headers = [
  'work_id',
  'kv_section',
  'catalogue_release',
  'catalogue_nr',
  'kv',
  'kv1',
  'kv2',
  'kv3',
  'kv3a',
  'kv6',
  'other_catalog_refs',
  'title_en',
  'title_de',
  'nickname_en',
  'nickname_de',
  'new_kv',
  'movement',
  'vocal_title',
  'tempo',
  'movmnr',
  'movmnr_suff',
  'music_key',
  'meter',
  'measures',
  'instruments',
  'genre_en',
  'genre_de',
  'series_en',
  'series_de',
  'group_en',
  'group_de',
  'date_begin',
  'date_end',
  'location_en',
  'location_de',
  'location_iso',
  'composer',
  'other_persons',
  'cast',
  'status_work',
  'status_transmission',
  'status_authenticity',
  'is_published_kv',
  'id_wmtf',
];

const rows = data.map((w) => {
  const editionMap = Object.fromEntries(KV_EDITIONS.map((k) => [k, []]));
  const otherRefs = [];

  const pushRef = (release, nr) => {
    if (!release || nr == null || nr === '') return;
    const val = String(nr);
    if (KV_EDITIONS.includes(release)) editionMap[release].push(val);
    else otherRefs.push(`${release} ${val}`);
  };

  pushRef(w.work_catalog_nr?.release, w.work_catalog_nr?.nr);
  for (const r of w.work_catalog_ref_nrs || []) pushRef(r.release, r.nr);

  const genres = w.genres || [];
  const seriesGrps = w.workSeriesGrps || [];
  const locs = w.creationLocs || [];
  const persons = w.persons || [];
  const composers = persons.filter((p) => p.role?.role_mei === 'composer');
  const others = persons.filter((p) => p.role?.role_mei !== 'composer');

  const cast = (w.castList || [])
    .map((c) => [c.role, c.voice].filter(Boolean).join(' / '))
    .filter(Boolean)
    .join('; ');

  return [
    w.work_id,
    w.kv_section,
    w.work_catalog_nr?.release || '',
    w.work_catalog_nr?.nr || '',
    ...KV_EDITIONS.map((k) => [...new Set(editionMap[k])].join('; ')),
    [...new Set(otherRefs)].join('; '),
    lang(w.kv_title, 'EN'),
    lang(w.kv_title, 'DE'),
    lang(w.nicknames?.alias, 'EN'),
    lang(w.nicknames?.alias, 'DE'),
    w.nicknames?.new_kv ?? '',
    w.movement || '',
    w.vocal_title || '',
    w.tempo || '',
    w.movmnr || '',
    w.movmnr_suff || '',
    w.music_key || '',
    w.meter || '',
    w.measures || '',
    w.instruments || '',
    genres.map((g) => lang(g, 'EN')).filter(Boolean).join('; '),
    genres.map((g) => lang(g, 'DE')).filter(Boolean).join('; '),
    seriesGrps.map((s) => lang(s.series, 'EN')).filter(Boolean).join('; '),
    seriesGrps.map((s) => lang(s.series, 'DE')).filter(Boolean).join('; '),
    seriesGrps.map((s) => lang(s.group, 'EN')).filter(Boolean).join('; '),
    seriesGrps.map((s) => lang(s.group, 'DE')).filter(Boolean).join('; '),
    fmtDate(w.yearOfBegin, w.monthOfBegin, w.dayOfBegin, w.yearOfBeginAff),
    fmtDate(
      w.yearOfTermination,
      w.monthOfTermination,
      w.dayOfTermination,
      w.yearOfTerminationAff,
    ),
    locs.map((l) => lang(l, 'EN')).filter(Boolean).join('; '),
    locs.map((l) => lang(l, 'DE')).filter(Boolean).join('; '),
    locs.map((l) => l.iso_3166).filter(Boolean).join('; '),
    composers.map(personName).join('; '),
    others
      .map((p) => `${personName(p)} [${p.role?.role_mei || lang(p.role, 'EN') || '?'}]`)
      .join('; '),
    cast,
    w.status_work ?? '',
    w.status_transmission ?? '',
    w.status_authenticity ?? '',
    w.isPublished_KV ?? '',
    w.IDWmtf ?? '',
  ]
    .map(esc)
    .join(',');
});

const outPath = path.join(root, 'KV-works.csv');
const csv = `${headers.join(',')}\n${rows.join('\n')}\n`;
fs.writeFileSync(outPath, csv, 'utf8');
console.log(`Wrote ${outPath}`);
console.log(`Rows: ${data.length}, size: ${(csv.length / 1024).toFixed(1)} KB`);
