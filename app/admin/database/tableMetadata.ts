export type TableGroup = 'core' | 'cataloguing' | 'relationships' | 'other'

export const GROUP_LABELS: Record<TableGroup, string> = {
    core: 'Core data',
    cataloguing: 'Cataloguing',
    relationships: 'Relationships',
    other: 'Other',
}

const GROUP_ORDER: TableGroup[] = ['core', 'cataloguing', 'relationships', 'other']

export interface CategoryMeta {
    label: string
    slug: string
    description: string
}

export const CATEGORY_META: Record<Exclude<TableGroup, 'other'>, CategoryMeta> = {
    core: {
        label: 'Core data',
        slug: 'core-data',
        description: 'Primary entities used by the music database.',
    },
    cataloguing: {
        label: 'Cataloguing',
        slug: 'cataloguing',
        description: 'Catalogue and tracklist structures.',
    },
    relationships: {
        label: 'Relationships',
        slug: 'relationships',
        description: 'Connections between artists, works, recordings and releases.',
    },
}

const SLUG_TO_GROUP: Record<string, TableGroup> = {
    'core-data': 'core',
    'cataloguing': 'cataloguing',
    'relationships': 'relationships',
}

export function getGroupBySlug(slug: string): TableGroup | null {
    return SLUG_TO_GROUP[slug] ?? null
}

interface TableMeta {
    label: string
    group: TableGroup
    description: string
    relationship?: { from: string; to: string }
    order: number
}

const TABLE_META: Record<string, TableMeta> = {
    artists:              { label: 'Artists',              group: 'core',          description: 'Performers, ensembles and collaborators.', order: 1 },
    works:                { label: 'Works',                group: 'core',          description: 'Compositions in the archive.', order: 2 },
    recordings:           { label: 'Recordings',           group: 'core',          description: 'Individual recorded performances.', order: 3 },
    releases:             { label: 'Releases',             group: 'core',          description: 'Albums and published collections.', order: 4 },
    tracklists:           { label: 'Tracklists',           group: 'core',          description: 'Tracklist definitions for releases.', order: 5 },

    catalogues:           { label: 'Catalogues',           group: 'cataloguing',   description: 'Catalogue definitions.', order: 1 },
    catalogue_entries:    { label: 'Catalogue entries',    group: 'cataloguing',   description: 'Links works to catalogue numbers.', order: 2 },
    tracklist_entries:    { label: 'Tracklist entries',    group: 'cataloguing',   description: 'Defines the recording order within a release.', order: 3 },

    artist_roles:         { label: 'Artist roles',         group: 'relationships', description: 'Artists → Roles',                        relationship: { from: 'Artists', to: 'Roles' },         order: 1 },
    group_members:        { label: 'Group members',        group: 'relationships', description: 'Groups → Artists',                       relationship: { from: 'Groups', to: 'Artists' },        order: 2 },
    recording_performers: { label: 'Recording artists',    group: 'relationships', description: 'Recordings → Artists',                   relationship: { from: 'Recordings', to: 'Artists' },   order: 3 },
    recording_works:      { label: 'Recording works',      group: 'relationships', description: 'Recordings → Works',                     relationship: { from: 'Recordings', to: 'Works' },      order: 4 },
    release_artists:      { label: 'Release artists',      group: 'relationships', description: 'Releases → Artists',                     relationship: { from: 'Releases', to: 'Artists' },       order: 5 },
    release_composers:    { label: 'Release composers',    group: 'relationships', description: 'Releases → Composers',                   relationship: { from: 'Releases', to: 'Composers' },    order: 6 },
    work_composers:       { label: 'Work artists',         group: 'relationships', description: 'Works → Artists',                        relationship: { from: 'Works', to: 'Artists' },           order: 7 },
}

function titleCase(name: string): string {
    return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

export function getTableLabel(tableName: string): string {
    return TABLE_META[tableName]?.label ?? titleCase(tableName)
}

export function getTableGroup(tableName: string): TableGroup {
    return TABLE_META[tableName]?.group ?? 'other'
}

export function getTableDescription(tableName: string): string {
    return TABLE_META[tableName]?.description ?? ''
}

export function getTableRelationship(tableName: string): { from: string; to: string } | null {
    return TABLE_META[tableName]?.relationship ?? null
}

export function getTableOrder(tableName: string): number {
    return TABLE_META[tableName]?.order ?? 999
}

export interface GroupedTable {
    name: string
    label: string
    description: string
}

export interface TableGroupEntry {
    group: TableGroup
    groupLabel: string
    items: GroupedTable[]
}

export function groupedTables(tables: string[]): TableGroupEntry[] {
    const buckets = new Map<TableGroup, GroupedTable[]>()
    for (const group of GROUP_ORDER) buckets.set(group, [])

    for (const name of tables) {
        const group = getTableGroup(name)
        buckets.get(group)!.push({
            name,
            label: getTableLabel(name),
            description: getTableDescription(name),
        })
    }

    for (const items of buckets.values()) {
        items.sort((a, b) => getTableOrder(a.name) - getTableOrder(b.name))
    }

    return GROUP_ORDER
        .filter(group => (buckets.get(group)?.length ?? 0) > 0)
        .map(group => ({
            group,
            groupLabel: GROUP_LABELS[group],
            items: buckets.get(group)!,
        }))
}

export interface CategoryTableInfo {
    name: string
    label: string
    description: string
    rowCount: number
    relationship?: { from: string; to: string }
}

export interface CategoryInfo {
    group: TableGroup
    label: string
    slug: string
    description: string
    tables: CategoryTableInfo[]
}

export function buildCategoryOverview(
    tables: string[],
    rowCountMap: Map<string, number>,
): CategoryInfo[] {
    return GROUP_ORDER
        .filter(g => g !== 'other')
        .map(group => {
            const meta = CATEGORY_META[group as Exclude<TableGroup, 'other'>]
            const groupTables = tables
                .filter(t => getTableGroup(t) === group)
                .sort((a, b) => getTableOrder(a) - getTableOrder(b))
                .map(name => ({
                    name,
                    label: getTableLabel(name),
                    description: getTableDescription(name),
                    rowCount: rowCountMap.get(name) ?? 0,
                    relationship: getTableRelationship(name) ?? undefined,
                }))
            return {
                group,
                label: meta.label,
                slug: meta.slug,
                description: meta.description,
                tables: groupTables,
            }
        })
        .filter(c => c.tables.length > 0)
}

export function getTablesForCategory(tables: string[], group: TableGroup): string[] {
    return tables
        .filter(t => getTableGroup(t) === group)
        .sort((a, b) => getTableOrder(a) - getTableOrder(b))
}
