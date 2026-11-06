import 'server-only';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const LOCAL_CSV_DIR = path.join(process.cwd(), 'data', 'catalogues');
const LOCAL_META_DIR = path.join(process.cwd(), 'data', 'meta');
const DATA_CACHE_TTL_MS = 5 * 60 * 1000;

interface CsvWork {
    catalogue: string;
    title: string;
    genre: string;
    key: string;
    instrumentation: string;

    [key: string]: string;
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
    alias_cn: string;

    [key: string]: string;
}

const csvCache = new Map<string, {
    expiresAt: number;
    request: Promise<CsvWork[]>;
}>();
let composersCache: {
    expiresAt: number;
    request: ReturnType<typeof fetchAndParseComposers>;
} | undefined;

async function fetchCsv(csvPath: string) {
    const fullPath = path.join(LOCAL_CSV_DIR, csvPath);
    console.log(`[fetchCsv] Reading: ${fullPath}`);
    const csvContent = await fs.readFile(fullPath, 'utf-8');
    console.log(`[fetchCsv] Read ${csvContent.length} bytes from ${csvPath}`);

    return {
        text: async () => csvContent,
    };
}

async function loadCatalog(catalogCode: string): Promise<CsvWork[]> {
    const cached = csvCache.get(catalogCode);
    if (cached && cached.expiresAt > Date.now()) return cached.request;

    const request = (async () => {
        const response = await fetchCsv(`${catalogCode}.csv`);
        return parseCsvRecords<CsvWork>(await response.text());
    })();
    const cacheEntry = {expiresAt: Date.now() + DATA_CACHE_TTL_MS, request};
    csvCache.set(catalogCode, cacheEntry);
    try {
        return await request;
    } catch (error) {
        if (csvCache.get(catalogCode) === cacheEntry) csvCache.delete(catalogCode);
        throw error;
    }
}

type ComposerCsvEntry = {
    artistId: number;
    name: string;
    nameSort: string;
    aliases: {
        org: string;
        en: string;
        de: string;
        fr: string;
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
    cataloguerName: string | null | undefined;
    era: string;
    wikiQID: string;
    catalogRef?: string;
    catalogRefUrl?: string;
    catalogPublisher?: string;
    spotify?: string;
};

async function fetchAndParseComposers(): Promise<ComposerCsvEntry[]> {
    const csvPath = path.join(LOCAL_META_DIR, 'composers.csv');
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    const composers = parseCsvRecords(csvContent) as CsvComposer[];

    return composers.map((composer, index) => {
        const name = composer.Name || '';
        const catalogueField = Object.keys(composer).find(
            field => field.toLocaleLowerCase() === 'catalogue',
        );
        const cataloguerField = Object.keys(composer).find(
            field => field.toLocaleLowerCase() === 'cataloguer',
        );
        return {
            artistId: index + 1,
            name,
            nameSort: composer['Sort Name'] || '',
            aliases: {
                org: composer.alias_org || '',
                en: composer.alias_en || '',
                de: composer.alias_de || '',
                fr: composer.alias_fr || '',
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
            cataloguerName: cataloguerField === undefined ? undefined : composer[cataloguerField].trim() || null,
            era: composer.Era || '',
            wikiQID: composer.WikiQID?.trim() || '',
            catalogRef: composer.CatalogueRef?.trim() || undefined,
            catalogRefUrl: composer.CatalogueRefUrl?.trim() || undefined,
            catalogPublisher: composer.Publisher?.trim() || undefined,
            spotify: composer.Spotify || undefined,
        };
    });

}

async function loadComposers(): Promise<ComposerCsvEntry[]> {
    if (!composersCache || composersCache.expiresAt <= Date.now()) {
        composersCache = {
            expiresAt: Date.now() + DATA_CACHE_TTL_MS,
            request: fetchAndParseComposers(),
        };
    }
    const cacheEntry = composersCache;
    try {
        return await cacheEntry.request;
    } catch (error) {
        if (composersCache === cacheEntry) composersCache = undefined;
        throw error;
    }
}

export function clearCsvCache() {
    csvCache.clear();
    composersCache = undefined;
}

export async function clearCatalogueCache(catalogCode: string) {
    csvCache.delete(catalogCode);
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

const OPUS_CATALOGUES = new Set(['Corelli', 'Shostakovich', 'Beethoven', 'BrittenB', 'Prokofiev']);

/**
 * Resolves the catalogue number of a work. Every catalogue names its own
 * column, so the lookup order differs per catalogue.
 */
function getCatalogueNumber(work: CsvWork, catalogCode: string): string {
    switch (catalogCode) {
        case 'Corelli':
        case 'Shostakovich':
        case 'Beethoven':
        case 'BrittenB':
        case 'Prokofiev':
            return getCsvValue(work, 'Opus', 'opus') || getCsvValue(work, 'SORT', 'sort');
        case 'Tchaikovsky':
            return getCsvValue(work, 'TH', 'th');
        case 'Kirkpatrick':
            return getCsvValue(work, 'Kirkpatrick');
        default:
            return getCsvValue(work, 'Catalogue');
    }
}

/**
 * Resolves the alternative numbering of a work, e.g. Wotquenne for Helm or the
 * Longo and Pestelli systems for Kirkpatrick.
 */
function getSecondaryCatalogueNumber(work: CsvWork, catalogCode: string): string {
    switch (catalogCode) {
        case 'Helm':
            return getCsvValue(work, 'Wotquenne', 'Wq');
        case 'Kirkpatrick':
            return [getCsvValue(work, 'Longo'), getCsvValue(work, 'Pestelli')].filter(Boolean).join(' · ');
        case 'CNW':
            return getCsvValue(work, 'FS');
        default:
            return getCsvValue(work, 'Helm', 'H');
    }
}

export type InstrumentCsvEntry = {
    wikiQID: string;
    name: string;
    abbr: string;
    aliases: string[];
    category: string;
    categoryDim: string;
    familyWikiQID: string;
    parentName: string;
    familyName: string;
    familyRootName: string;
    relation: string;
    isFamilyRoot: boolean;
    mechanismTop: string;
    mechanismSub: string;
    aliasZh: string;
    aliasFr: string;
    aliasDe: string;
    sloganZh: string;
    sloganEn: string;
};

const INSTRUMENT_ABBR_PLACEHOLDER = '—';

export async function getInstrumentRows(): Promise<InstrumentCsvEntry[]> {
    const csvContent = await fs.readFile(path.join(LOCAL_META_DIR, 'instruments.csv'), 'utf-8');
    return parseCsvRecords(csvContent).map(row => ({
        wikiQID: row.WikiQID ?? '',
        name: row.name,
        abbr: row.abbr_std === INSTRUMENT_ABBR_PLACEHOLDER ? '' : row.abbr_std ?? '',
        aliases: (row.aliases ?? '').split(';').map(alias => alias.trim()).filter(Boolean),
        category: row.category ?? '',
        categoryDim: row.category_dim ?? '',
        familyWikiQID: row.family_WikiQID ?? '',
        parentName: row.parentName ?? '',
        familyName: row.familyName ?? '',
        familyRootName: row.familyRootName ?? '',
        relation: row.relation ?? '',
        isFamilyRoot: row.is_family_root === 'TRUE',
        mechanismTop: row.mechanism_top ?? '',
        mechanismSub: row.mechanism_sub ?? '',
        aliasZh: row.nameZH ?? '',
        aliasFr: row.nameFR ?? '',
        aliasDe: row.nameDE ?? '',
        sloganZh: row.sloganZH ?? '',
        sloganEn: row.sloganEN ?? '',
    }));
}

export async function getComposers(): Promise<ComposerCsvEntry[]> {
    return loadComposers();
}

export async function getComposerWorks(catalogCode: string): Promise<Array<{
    workId: number;
    sort: string;
    catalogue: string;
    opus: string;
    secondaryCatalogue: string;
    date: string;
    title: string;
    genre: string;
    key: string;
    instrumentation: string;
    details: Record<string, string>;
}>> {
    const works = await loadCatalog(catalogCode);

    return works.map((work, index) => {
        const isOpusCatalogue = OPUS_CATALOGUES.has(catalogCode);
        // The Kirkpatrick sheet names its own columns and carries two alternative
        // numbering systems (Longo and Pestelli) next to the Kk. numbers.
        const isKirkpatrick = catalogCode === 'Kirkpatrick';
        const genre = getCsvValue(work, 'Genre', 'Type');
        const key = getCsvValue(work, 'Key');

        return {
            workId: Number(work._workId) || index + 1,
            sort: isKirkpatrick
                ? getCsvValue(work, 'SORT_Kk')
                : catalogCode === 'Ratner'
                    ? getCsvValue(work, 'SORT_R')
                    : getCsvValue(work, 'SORT', 'sort'),
            catalogue: getCatalogueNumber(work, catalogCode),
            opus: isOpusCatalogue
                ? ''
                : getCsvValue(work, 'Opus', 'opus'),
            secondaryCatalogue: getSecondaryCatalogueNumber(work, catalogCode),
            date: catalogCode === 'Tchaikovsky'
                ? getCsvValue(work, 'Year', 'year')
                : getCsvValue(work, 'Date', 'date'),
            title: getCsvValue(work, 'Title', 'title'),
            genre,
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

export type GenreCsvEntry = { wikiQID: string; inCategory: string; name: string; typeOf: string }

export async function getGenreCsvEntries(): Promise<GenreCsvEntry[]> {
    const csvContent = await fs.readFile(path.join(LOCAL_META_DIR, 'genres.csv'), 'utf-8')
    return parseCsvRecords(csvContent).map(row => ({
        wikiQID: row.WikiQID,
        inCategory: row.category_raw ?? '',
        name: row.name,
        typeOf: row.parent_name ?? '',
    }))
}
