import 'server-only';

const CSV_SOURCES = [
  // Prefer jsDelivr: raw.githubusercontent.com often times out on restricted networks.
  'https://cdn.jsdelivr.net/gh/KenParker-CN/konzert-public-data@main/csv',
  'https://raw.githubusercontent.com/KenParker-CN/konzert-public-data/main/csv',
] as const;
const COMPOSERS_REVALIDATE_SECONDS = 60;
const CATALOG_REVALIDATE_SECONDS = 60;
const isDev = process.env.NODE_ENV === 'development';

interface CsvWork {
  catalogue: string;
  title: string;
  type: string;
  key: string;
  instrumentation: string;
  [key: string]: string;
}

interface CsvComposer {
  Name: string;
  'Sort Name': string;
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

const csvCache = new Map<string, CsvWork[]>();

async function fetchCsv(path: string, revalidateSeconds: number) {
  let lastError: unknown;

  for (let index = 0; index < CSV_SOURCES.length; index++) {
    const base = CSV_SOURCES[index];
    const url = `${base}/${path}`;
    const isLast = index === CSV_SOURCES.length - 1;
    const init = {
      ...(isDev
        ? { cache: 'no-store' as const }
        : { next: { revalidate: revalidateSeconds } }),
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

async function loadCatalog(catalogCode: string): Promise<CsvWork[]> {
  // In-memory cache is process-scoped; skip in dev so CSV edits show up after refresh.
  if (!isDev && csvCache.has(catalogCode)) {
    return csvCache.get(catalogCode)!;
  }

  const response = await fetchCsv(`${catalogCode}.csv`, CATALOG_REVALIDATE_SECONDS);
  const works = parseCsvRecords<CsvWork>(await response.text());

  if (!isDev) {
    csvCache.set(catalogCode, works);
  }
  return works;
}

async function loadComposers(): Promise<Array<{
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
}>> {
  const response = await fetchCsv('composers.csv', COMPOSERS_REVALIDATE_SECONDS);
  const composers = parseCsvRecords(await response.text()) as CsvComposer[];

  return composers.map((composer, index) => {
    const name = composer.Name || '';
    const slug = slugify(name);
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
    };
  });

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

export async function getComposers(): Promise<Array<{
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
}>> {
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

  return works.map((work, index) => ({
    workId: index + 1,
    catalogue: catalogCode === 'Corelli'
      ? getCsvValue(work, 'Opus', 'opus')
      : catalogCode === 'MWV'
      ? getCsvValue(work, 'MWV', 'Catalogue', 'catalogue')
      : getCsvValue(work, 'Catalogue', 'catalogue', 'Wotquenne', 'Wq'),
    opus: catalogCode === 'Corelli'
      ? ''
      : getCsvValue(work, 'Opus', 'opus'),
    secondaryCatalogue: getCsvValue(work, 'Helm', 'H'),
    date: getCsvValue(work, 'Date', 'date'),
    title: getCsvValue(work, 'Title', 'title'),
    type: getCsvValue(work, 'Type', 'type'),
    key: getCsvValue(work, 'Key', 'key'),
    instrumentation: getCsvValue(work, 'Instrumentation', 'instrumentation'),
    details: Object.fromEntries(
      Object.entries(work).filter(([field]) => !/sort/i.test(field)),
    ),
  }));
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