import 'server-only';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/KenParker-CN/konzert-public-data/main/csv';

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
let composersCache: Array<{
  artistId: number;
  slug: string;
  name: string;
  nameSort: string;
  type: string;
  artistCategory: string;
  startDate: string | null;
  endDate: string | null;
  biography: string | null;
  workCount: number;
}> | null = null;

async function loadCatalog(catalogCode: string): Promise<CsvWork[]> {
  if (csvCache.has(catalogCode)) {
    return csvCache.get(catalogCode)!;
  }

  const url = `${GITHUB_RAW_BASE}/${catalogCode}.csv`;
  const response = await fetch(url, { next: { revalidate: 3600 } });

  if (!response.ok) {
    throw new Error(`Failed to load ${catalogCode}.csv: ${response.status}`);
  }

  const works = parseCsvRecords<CsvWork>(await response.text());

  csvCache.set(catalogCode, works);
  return works;
}

async function loadComposers(): Promise<Array<{
  artistId: number;
  slug: string;
  name: string;
  nameSort: string;
  type: string;
  artistCategory: string;
  startDate: string | null;
  endDate: string | null;
  biography: string | null;
  workCount: number;
}>> {
  if (composersCache) return composersCache;

  const url = `${GITHUB_RAW_BASE}/composers.csv`;
  const response = await fetch(url, { next: { revalidate: 3600 } });

  if (!response.ok) {
    throw new Error(`Failed to load composers.csv: ${response.status}`);
  }

  const composers = parseCsvRecords(await response.text()) as CsvComposer[];

  composersCache = composers.map((composer, index) => {
    const name = composer.Name || '';
    const slug = slugify(name);
    const birth = composer.Birth?.replace(/\//g, '-') || '';
    const died = composer.Died?.replace(/\//g, '-') || '';
    
    return {
      artistId: index + 1,
      slug,
      name,
      nameSort: composer['Sort Name'] || '',
      type: 'composer',
      artistCategory: 'classical',
      startDate: birth ? `${birth.split('-')[0]}-${birth.split('-')[1].padStart(2, '0')}-${birth.split('-')[2].padStart(2, '0')}` : null,
      endDate: died ? `${died.split('-')[0]}-${died.split('-')[1].padStart(2, '0')}-${died.split('-')[2].padStart(2, '0')}` : null,
      biography: composer.Intro || '',
      workCount: 0,
    };
  });

  return composersCache;
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
  }
  return '';
}

export async function getComposers(): Promise<Array<{
  artistId: number;
  slug: string;
  name: string;
  nameSort: string;
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
    catalogue: getCsvValue(work, 'Catalogue', 'catalogue', 'Wotquenne', 'Wq'),
    opus: getCsvValue(work, 'Opus', 'opus'),
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