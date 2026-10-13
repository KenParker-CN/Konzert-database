import 'server-only';

const CSV_SOURCES = [
  // Prefer jsDelivr: raw.githubusercontent.com often times out on restricted networks.
  'https://cdn.jsdelivr.net/gh/KenParker-CN/konzert-public-data@main/csv',
  'https://raw.githubusercontent.com/KenParker-CN/konzert-public-data/main/csv',
] as const;
const COMPOSER_CSV_SOURCES = [CSV_SOURCES[1], CSV_SOURCES[0]] as const;
const KV_API_URL = 'https://dme.mozarteum.at/digital-editions/api/kv-entriesidx';

interface CsvWork {
  catalogue: string;
  title: string;
  type: string;
  key: string;
  instrumentation: string;
  [key: string]: string;
}

interface KvApiEntry {
  work_id: number;
  isPublished_KV: number;
  work_catalog_nr: {
    release: string;
    nr: string;
  };
  work_catalog_ref_nrs: Array<{
    release: string;
    nr: string;
  }> | null;
  kv_title: {
    lang: {
      DE?: string;
      EN?: string;
    };
  };
  nicknames?: {
    alias?: {
      lang?: {
        DE?: string;
        EN?: string;
      };
    } | null;
    new_kv?: string | null;
  } | null;
  movement?: string;
  vocal_title?: string;
  tempo?: string;
  music_key?: string;
  meter?: string;
  measures?: string;
  instruments?: string;
  genres?: Array<{
    lang?: {
      DE?: string;
      EN?: string;
    };
  }> | null;
  workSeriesGrps?: Array<{
    group?: {
      lang?: {
        DE?: string;
        EN?: string;
      };
    };
  }> | null;
  yearOfBegin?: string;
  yearOfTermination?: string;
  creationLocs?: Array<{
    lang?: {
      DE?: string;
      EN?: string;
    };
  }> | null;
}

interface CsvComposer {
  Name: string;
  'Sort Name': string;
  Catalogue: string;
  Birth: string;
  Died: string;
  Nationality: string;
  Nationality_2: string;
  Intro: string;
  Note: string;
  alias_org: string;
  alias_en: string;
  alias_de: string;
  alias_fr: string;
  alias_jp: string;
  alias_cn: string;
  [key: string]: string;
}

const csvCache = new Map<string, Promise<CsvWork[]>>();
let composersCache: ReturnType<typeof fetchAndParseComposers> | undefined;

async function fetchCsv(
  path: string,
  sources: readonly string[] = CSV_SOURCES,
) {
  let lastError: unknown;

  for (let index = 0; index < sources.length; index++) {
    const base = sources[index];
    const url = `${base}/${path}`;
    const isLast = index === sources.length - 1;
    const init = {
      cache: 'no-store' as const,
      // Fail over quickly if the preferred CDN hangs; last source has no short timeout.
      ...(isLast ? {} : { signal: AbortSignal.timeout(8000) }),
    };

    try {
      const response = await fetch(url, init);
      if (response.ok) return response;
      lastError = new Error(`Failed to load ${path} from ${base}: ${response.status}`);
    } catch (error) {
      // Ignore abort/timeout from a failed source and try the next one.
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to load ${path}`, { cause: lastError });
}

function isKvApiEntry(value: unknown): value is KvApiEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  const catalogueNumber = entry.work_catalog_nr;
  const title = entry.kv_title;

  return typeof entry.work_id === 'number'
    && typeof entry.isPublished_KV === 'number'
    && !!catalogueNumber
    && typeof catalogueNumber === 'object'
    && typeof (catalogueNumber as Record<string, unknown>).release === 'string'
    && typeof (catalogueNumber as Record<string, unknown>).nr === 'string'
    && !!title
    && typeof title === 'object'
    && !!(title as Record<string, unknown>).lang
    && typeof (title as Record<string, unknown>).lang === 'object';
}

const superscriptDigits: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
};

function formatKvRelease(release: string): string {
  const match = /^KV(\d+)$/i.exec(release);
  return match ? `KV${[...match[1]].map(digit => superscriptDigits[digit]).join('')}` : release;
}

function mapKvApiEntries(value: unknown): CsvWork[] {
  if (!Array.isArray(value) || value.length === 0 || !value.every(isKvApiEntry)) {
    throw new Error('Mozarteum KV API returned an invalid response');
  }

  const publishedEntries = value.filter(entry => entry.isPublished_KV === 1);
  if (publishedEntries.length === 0) {
    throw new Error('Mozarteum KV API returned no published entries');
  }

  return publishedEntries.map(entry => {
    const {release, nr} = entry.work_catalog_nr;
    const catalogue = release
      ? `${formatKvRelease(release)} ${nr}`.trim()
      : `KV ${nr}`.trim();
    const title = entry.kv_title.lang.EN?.trim() || entry.kv_title.lang.DE?.trim() || '';
    const genres = (entry.genres ?? [])
      .map(genre => genre.lang?.EN?.trim() || genre.lang?.DE?.trim() || '')
      .filter(Boolean);
    const groups = (entry.workSeriesGrps ?? [])
      .map(workSeriesGroup => workSeriesGroup.group?.lang?.EN?.trim() || workSeriesGroup.group?.lang?.DE?.trim() || '')
      .filter(Boolean);
    const references = (entry.work_catalog_ref_nrs ?? [])
      .filter(reference => reference.release !== release || reference.nr !== nr)
      .map(reference => `${formatKvRelease(reference.release)} ${reference.nr}`.trim())
      .filter(Boolean)
      .join(', ');
    const startYear = entry.yearOfBegin?.trim() ?? '';
    const endYear = entry.yearOfTermination?.trim() ?? '';
    const date = startYear && endYear && startYear !== endYear
      ? `${startYear}–${endYear}`
      : startYear || endYear;
    const nickname = entry.nicknames?.alias?.lang?.EN?.trim()
      || entry.nicknames?.alias?.lang?.DE?.trim()
      || '';
    const location = (entry.creationLocs ?? [])
      .map(place => place.lang?.EN?.trim() || place.lang?.DE?.trim() || '')
      .filter(place => place && !/^\[(unknown|unbekannt)\]$/i.test(place))
      .join(', ');

    return {
      _workId: String(entry.work_id),
      catalogue,
      title,
      type: groups[0] ?? '',
      key: entry.music_key?.trim() ?? '',
      instrumentation: entry.instruments?.trim() ?? '',
      Date: date,
      ...(entry.kv_title.lang.DE?.trim() && entry.kv_title.lang.DE.trim() !== title
        ? {'German title': entry.kv_title.lang.DE.trim()}
        : {}),
      ...(nickname ? {Nickname: nickname} : {}),
      ...(references ? {'Other catalogue references': references} : {}),
      ...(entry.movement?.trim() ? {Movement: entry.movement.trim()} : {}),
      ...(entry.vocal_title?.trim() ? {'Vocal title': entry.vocal_title.trim()} : {}),
      ...(entry.tempo?.trim() ? {Tempo: entry.tempo.trim()} : {}),
      ...(entry.meter?.trim() ? {Meter: entry.meter.trim()} : {}),
      ...(entry.measures?.trim() ? {Measures: entry.measures.trim()} : {}),
      ...(genres.length ? {Genres: genres.join('; ')} : {}),
      ...(groups.length > 1 ? {Groups: groups.join('; ')} : {}),
      ...(location ? {'Creation location': location} : {}),
    };
  });
}

async function loadKvCatalog(): Promise<CsvWork[]> {
  try {
    const response = await fetch(KV_API_URL, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      throw new Error(`Mozarteum KV API request failed: ${response.status}`);
    }
    return mapKvApiEntries(await response.json());
  } catch (apiError) {
    try {
      const response = await fetchCsv('KV.csv');
      return parseCsvRecords<CsvWork>(await response.text());
    } catch (csvError) {
      throw new Error('Both the Mozarteum KV API and CSV fallback failed', {
        cause: new AggregateError([apiError, csvError]),
      });
    }
  }
}

async function loadCatalog(catalogCode: string): Promise<CsvWork[]> {
  const cached = csvCache.get(catalogCode);
  if (cached) return cached;

  const request = catalogCode === 'KV'
    ? loadKvCatalog()
    : fetchCsv(`${catalogCode}.csv`)
      .then(async response => parseCsvRecords<CsvWork>(await response.text()));
  csvCache.set(catalogCode, request);
  try {
    return await request;
  } catch (error) {
    if (csvCache.get(catalogCode) === request) csvCache.delete(catalogCode);
    throw error;
  }
}

type ComposerCsvEntry = {
  artistId: number;
  slug: string;
  name: string;
  nameSort: string;
  aliases: {
    org: string;
    en: string;
    de: string;
    fr: string;
    ja: string;
    zh: string;
  };
  nationalities: string[];
  type: string;
  artistCategory: string;
  startDate: string | null;
  endDate: string | null;
  biography: string | null;
  workCount: number;
  catalogueName: string | null | undefined;
};

async function fetchAndParseComposers(): Promise<ComposerCsvEntry[]> {
  const response = await fetchCsv('composers.csv', COMPOSER_CSV_SOURCES);
  const composers = parseCsvRecords(await response.text()) as CsvComposer[];

  return composers.map((composer, index) => {
    const name = composer.Name || '';
    const slug = slugify(name);
    const catalogueField = Object.keys(composer).find(
      field => field.toLocaleLowerCase() === 'catalogue',
    );
    return {
      artistId: index + 1,
      slug,
      name,
      nameSort: composer['Sort Name'] || '',
      aliases: {
        org: composer.alias_org || '',
        en: composer.alias_en || '',
        de: composer.alias_de || '',
        fr: composer.alias_fr || '',
        ja: composer.alias_jp || '',
        zh: composer.alias_cn || '',
      },
      nationalities: [composer.Nationality, composer.Nationality_2].filter(Boolean),
      type: 'composer',
      artistCategory: 'classical',
      startDate: composer.Birth || null,
      endDate: composer.Died || null,
      biography: composer.Intro || '',
      workCount: 0,
      // undefined: CSV without the Catalogue column; null: composer has no catalogue.
      catalogueName: catalogueField === undefined ? undefined : composer[catalogueField].trim() || null,
    };
  });

}

async function loadComposers(): Promise<ComposerCsvEntry[]> {
  if (!composersCache) composersCache = fetchAndParseComposers();
  const request = composersCache;
  try {
    return await request;
  } catch (error) {
    if (composersCache === request) composersCache = undefined;
    throw error;
  }
}

export function clearCsvCache() {
  csvCache.clear();
  composersCache = undefined;
}

function slugify(name: string) {
  return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseCsvRecords<T extends Record<string, string> = Record<string, string>>(text: string): T[] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];

    if (char === '"') {
      if (inQuotes && text[index + 1] === '"') {
        field += '"';
        index++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes && char === ',') {
      record.push(field);
      field = '';
    } else if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && text[index + 1] === '\n') index++;
      record.push(field);
      if (record.some(value => value.trim())) records.push(record);
      record = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field || record.length) {
    record.push(field);
    if (record.some(value => value.trim())) records.push(record);
  }

  const [headers, ...rows] = records;
  if (!headers) return [];

  return rows.map(row => {
    const values: Record<string, string> = {};
    headers.forEach((header, index) => {
      const key = header.trim().replace(/^\uFEFF/, '');
      if (key) values[key] = row[index]?.trim() ?? '';
    });
    return values as T;
  });
}

function getCsvValue(record: CsvWork, ...fieldNames: string[]): string {
  for (const fieldName of fieldNames) {
    const value = record[fieldName];
    if (value) return value;
    // Try case-insensitive match
    const lowerFieldName = fieldName.toLowerCase();
    for (const key in record) {
      if (key.toLowerCase() === lowerFieldName && record[key]) {
        return record[key];
      }
    }
  }
  return '';
}

export async function getComposers(): Promise<ComposerCsvEntry[]> {
  return loadComposers();
}

export async function getComposerWorks(catalogCode: string): Promise<Array<{
  workId: number;
  catalogue: string;
  opus: string;
  secondaryCatalogue: string;
  date: string;
  title: string;
  type: string;
  key: string;
  instrumentation: string;
  details: Record<string, string>;
}>> {
  const works = await loadCatalog(catalogCode);

  return works.map((work, index) => {
    const isOpusCatalogue = catalogCode === 'Corelli' || catalogCode === 'Shostakovich';
    let type = getCsvValue(work, 'Type', 'type');
    let key = getCsvValue(work, 'Key', 'key');
    if (catalogCode === 'Tchaikovsky' && /^[A-G](#|b)? (major|minor)$/.test(type.trim()) && !key) {
      // The Tchaikovsky CSV carries the key in the Type column for the symphonies.
      key = type;
      type = '';
    }

    return {
      workId: Number(work._workId) || index + 1,
      catalogue: isOpusCatalogue
        ? getCsvValue(work, 'Opus', 'opus') || getCsvValue(work, 'SORT', 'sort')
        : catalogCode === 'MWV'
        ? getCsvValue(work, 'MWV', 'Catalogue', 'catalogue')
        : catalogCode === 'LWV'
        ? getCsvValue(work, 'Catalogue', 'LWV', 'catalogue')
        : catalogCode === 'Tchaikovsky'
        ? getCsvValue(work, 'TH', 'th')
        : getCsvValue(work, 'Catalogue', 'catalogue', 'Wotquenne', 'Wq'),
      opus: isOpusCatalogue
        ? ''
        : getCsvValue(work, 'Opus', 'opus'),
      secondaryCatalogue: getCsvValue(work, 'Helm', 'H'),
      date: catalogCode === 'Tchaikovsky'
        ? getCsvValue(work, 'Year', 'year')
        : getCsvValue(work, 'Date', 'date'),
      title: getCsvValue(work, 'Title', 'title'),
      type,
      key,
      instrumentation: catalogCode === 'Shostakovich'
        ? getCsvValue(work, 'Setting', 'setting')
        : getCsvValue(work, 'Instrumentation', 'instrumentation'),
      details: Object.fromEntries(
        Object.entries(work).filter(([field, value]) => field && !field.startsWith('_') && value && !/(sort|order)/i.test(field)),
      ),
    };
  });
}

export async function getWorkFilterOptions(catalogCode: string) {
  const works = await loadCatalog(catalogCode);

  const catalogues = [...new Set(works.map(w => w.Catalogue || w.catalogue || '').filter(Boolean))];
  const types = [...new Set(works.map(w => w.Type || w.type || '').filter(Boolean))];
  const keys = [...new Set(works.map(w => w.Key || w.key || '').filter(Boolean))];
  const instrumentations = [...new Set(works.map(w => w.Instrumentation || w.instrumentation || '').filter(Boolean))];

  return { catalogue: catalogues, type: types, key: keys, instrumentation: instrumentations };
}

export async function getWorks(catalogCode: string, filters: {
  search?: string;
  catalogue?: string;
  type?: string;
  key?: string;
  instrumentation?: string;
} = {}): Promise<Array<{
  workId: number;
  catalogue: string;
  number: string;
  title: string;
  composer: string;
  type: string;
  key: string;
  instrumentation: string;
}>> {
  const works = await loadCatalog(catalogCode);

  return works
    .filter(work => {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const catalogue = (work.Catalogue || work.catalogue || '').toLowerCase();
        const title = (work.Title || work.title || '').toLowerCase();
        const type = (work.Type || work.type || '').toLowerCase();
        const key = (work.Key || work.key || '').toLowerCase();
        const instr = (work.Instrumentation || work.instrumentation || '').toLowerCase();
        if (!catalogue.includes(search) && !title.includes(search) && !type.includes(search) && !key.includes(search) && !instr.includes(search)) {
          return false;
        }
      }
      if (filters.catalogue) {
        const cat = (work.Catalogue || work.catalogue || '');
        if (!cat.startsWith(filters.catalogue)) return false;
      }
      if (filters.type && (work.Type || work.type || '') !== filters.type) return false;
      if (filters.key && (work.Key || work.key || '') !== filters.key) return false;
      if (filters.instrumentation && !(work.Instrumentation || work.instrumentation || '').includes(filters.instrumentation)) return false;
      return true;
    })
    .map((work, index) => ({
      workId: index + 1,
      catalogue: work.Catalogue || work.catalogue || '',
      number: '',
      title: work.Title || work.title || '',
      composer: '',
      type: work.Type || work.type || '',
      key: work.Key || work.key || '',
      instrumentation: work.Instrumentation || work.instrumentation || '',
    }));
}