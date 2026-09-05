/**
 * Field metadata for Admin CRUD forms.
 *
 * Maps database column names to user-friendly labels, placeholders, and display order.
 * Database schema and column names remain unchanged - this only affects UI display.
 */

export interface FieldMeta {
    label: string
    placeholder: string
    helpText?: string
}

/**
 * Field ordering per table.
 * Defines the display order in Add/Edit forms.
 * Fields not listed here appear after listed fields, in their original schema order.
 */
const fieldOrder: Record<string, string[]> = {
    works: [
        'title',
        'subtitle',
        'catalogue',
        'catalog_no',
        'composer_id',
        'type',
        'composition_year',
        'key_signature',
        'instrumentation',
        'note',
        'musicbrainz_id',
    ],
    artists: [
        'name',
        'name_sort',
        'nationality',
        'start_date',
        'end_date',
        'type',
        'artist_category',
        'biography',
        'musicbrainz_id',
    ],
    recordings: [
        'title',
        'duration_seconds',
        'recording_date',
        'musicbrainz_id',
    ],
    releases: [
        'title',
        'composer_id',
        'release_date',
        'label',
        'catalog_number',
        'genre',
        'cover_dlink',
        'strmlk_spo',
        'strmlk_apple',
        'strmlk_tid',
        'musicbrainz_id',
    ],
    tracklists: [
        'title',
        'composer_id',
        'artist_id',
        'release_date',
        'label',
        'catalog_number',
        'genre',
        'cover_dlink',
        'strmlk_spo',
        'strmlk_apple',
        'strmlk_tid',
        'musicbrainz_id',
    ],
    catalogue_entries: [
        'catalogue',
        'entry_no',
        'work_id',
    ],
    catalogues: [
        'code',
        'name',
        'artist_id',
    ],
    recording_performers: [
        'recording_id',
        'artist_id',
        'performance_role',
        'instrument',
    ],
    work_composers: [
        'work_id',
        'composer_id',
        'is_primary',
    ],
}

/**
 * Fields to explicitly hide per table.
 * These fields exist in the database but should not appear in the UI.
 */
const hiddenFields: Record<string, string[]> = {
    releases: ['type'],
    tracklists: ['type'],
}

/**
 * Columns hidden from the data table listing view (but still visible in Add/Edit forms).
 * These are developer-heavy fields that clutter the table: external IDs, timestamps, internal sort keys.
 */
const tableHiddenColumns: Record<string, string[]> = {
    works: ['musicbrainz_id', 'note', 'created_at', 'updated_at'],
    artists: ['musicbrainz_id', 'biography', 'created_at', 'updated_at'],
    recordings: ['musicbrainz_id', 'created_at', 'updated_at'],
    releases: ['musicbrainz_id', 'cover_dlink', 'strmlk_spo', 'strmlk_apple', 'strmlk_tid', 'created_at', 'updated_at'],
    tracklists: ['musicbrainz_id', 'cover_dlink', 'strmlk_spo', 'strmlk_apple', 'strmlk_tid', 'created_at', 'updated_at'],
    catalogue_entries: ['created_at', 'updated_at'],
    catalogues: ['created_at', 'updated_at'],
    recording_performers: ['created_at', 'updated_at'],
    work_composers: ['created_at', 'updated_at'],
}

/**
 * Primary key columns that should remain visible in the table listing view.
 * By default, PK columns ending with _id are hidden as they're internal identifiers.
 * This config overrides that behavior for specific tables.
 * Relationship tables need their FK columns visible to show the connections.
 */
const tableVisiblePkColumns: Record<string, string[]> = {
    recording_performers: ['recording_id', 'artist_id'],
    recording_works: ['recording_id', 'work_id'],
    work_composers: ['work_id', 'composer_id'],
    release_artists: ['release_id', 'artist_id'],
    release_composers: ['release_id', 'composer_id'],
    artist_roles: ['artist_id', 'role_id'],
    group_members: ['group_id', 'artist_id'],
    catalogue_entries: ['work_id'],
}

// Common field metadata shared across tables
const commonFields: Record<string, FieldMeta> = {
    // Primary keys
    work_id: { label: 'Work', placeholder: 'Enter work' },
    artist_id: { label: 'Artist', placeholder: 'Enter artist' },
    catalogue_id: { label: 'Catalogue', placeholder: 'Enter catalogue' },
    recording_id: { label: 'Recording', placeholder: 'Enter recording' },
    release_id: { label: 'Release', placeholder: 'Enter release' },
    tracklist_id: { label: 'Tracklist', placeholder: 'Enter tracklist' },
    entry_id: { label: 'Entry', placeholder: 'Enter entry' },

    // Common fields
    title: { label: 'Title', placeholder: 'Enter title' },
    subtitle: { label: 'Subtitle', placeholder: 'Enter subtitle' },
    name: { label: 'Name', placeholder: 'Enter name' },
    name_sort: { label: 'Sort name', placeholder: 'Enter sort name' },
    type: { label: 'Type', placeholder: 'e.g. Concerto, Sonata' },
    note: { label: 'Note', placeholder: 'Enter note' },
    notes: { label: 'Notes', placeholder: 'Enter notes' },

    // Catalogue fields
    catalog_no: { label: 'Catalogue number', placeholder: 'e.g. KV 207, RV 1' },
    catalog_number: { label: 'Catalogue number', placeholder: 'Enter catalogue number' },
    catalogue: { label: 'Catalogue', placeholder: 'e.g. KV, RV, BWV' },
    entry_no: { label: 'Entry number', placeholder: 'e.g. 207, 540a' },

    // Work fields
    composition_year: { label: 'Composition year', placeholder: 'e.g. 1725' },
    key_signature: { label: 'Key', placeholder: 'e.g. D minor' },
    instrumentation: { label: 'Instrumentation', placeholder: 'e.g. strings, continuo' },

    // Artist fields
    nationality: { label: 'Nationality', placeholder: 'e.g. Austrian, Italian' },
    artist_category: { label: 'Category', placeholder: 'e.g. classical, jazz' },
    start_date: { label: 'Start date', placeholder: 'e.g. 1756-01-27' },
    end_date: { label: 'End date', placeholder: 'e.g. 1791-12-05' },
    biography: { label: 'Biography', placeholder: 'Enter biography' },

    // Recording fields
    recording_date: { label: 'Recording date', placeholder: 'e.g. 2020-05-15' },
    duration_seconds: { label: 'Duration', placeholder: 'e.g. 180 (seconds)' },
    performance_role: { label: 'Role', placeholder: 'e.g. Solo, Conductor' },
    instrument: { label: 'Instrument', placeholder: 'e.g. Violin, Piano' },
    movement: { label: 'Movement', placeholder: 'e.g. Allegro' },
    part_number: { label: 'Part number', placeholder: 'e.g. 1, 2' },

    // Release / Tracklist fields
    release_date: { label: 'Release date', placeholder: 'e.g. 2020-01-01' },
    label: { label: 'Label', placeholder: 'e.g. Deutsche Grammophon' },
    genre: { label: 'Genre', placeholder: 'e.g. Classical, Baroque' },
    disc_number: { label: 'Disc number', placeholder: 'e.g. 1, 2' },
    track_number: { label: 'Track number', placeholder: 'e.g. 1, 2' },
    side: { label: 'Side', placeholder: 'e.g. A, B' },

    // External IDs and URLs
    musicbrainz_id: { label: 'MusicBrainz ID', placeholder: 'Enter MusicBrainz ID' },
    mb_id: { label: 'MusicBrainz ID', placeholder: 'Enter MusicBrainz ID' },
    cover_dlink: { label: 'Cover image URL', placeholder: 'Paste image URL' },
    cover_url: { label: 'Cover image URL', placeholder: 'Paste image URL' },
    strmlk_spo: { label: 'Spotify URL', placeholder: 'Paste Spotify URL' },
    spotify_url: { label: 'Spotify URL', placeholder: 'Paste Spotify URL' },
    strmlk_apple: { label: 'Apple Music URL', placeholder: 'Paste Apple Music URL' },
    apple_music_url: { label: 'Apple Music URL', placeholder: 'Paste Apple Music URL' },
    strmlk_tid: { label: 'TIDAL URL', placeholder: 'Paste TIDAL URL' },
    tidal_url: { label: 'TIDAL URL', placeholder: 'Paste TIDAL URL' },

    // Group / member fields
    group_name: { label: 'Group name', placeholder: 'Enter group name' },
    role: { label: 'Role', placeholder: 'e.g. Composer, Performer' },
    is_primary: { label: 'Primary', placeholder: '0 or 1' },
    pk_order: { label: 'PK order', placeholder: 'Enter PK order' },

    // Composer FK (shared across tables)
    composer_id: { label: 'Composer', placeholder: 'Select composer' },

    // Timestamps
    created_at: { label: 'Created at', placeholder: 'Auto-generated' },
}

// Table-specific overrides (for fields that need context-specific labels)
const tableSpecificFields: Record<string, Record<string, FieldMeta>> = {
    works: {
        title: { label: 'Title', placeholder: 'Enter work title' },
        catalog_no: { label: 'Catalogue number', placeholder: 'e.g. KV 207, RV 1' },
        composition_year: { label: 'Composition year', placeholder: 'e.g. 1725' },
        key_signature: { label: 'Key', placeholder: 'e.g. D minor' },
        instrumentation: { label: 'Instrumentation', placeholder: 'e.g. strings, continuo' },
        composer_id: { label: 'Composer', placeholder: 'Select composer' },
    },
    artists: {
        name: { label: 'Name', placeholder: 'Enter artist name' },
        name_sort: { label: 'Sort name', placeholder: 'e.g. Mozart, Wolfgang Amadeus' },
        artist_category: { label: 'Category', placeholder: 'e.g. classical, jazz' },
        biography: { label: 'Biography', placeholder: 'Enter biography' },
        musicbrainz_id: { label: 'MusicBrainz ID', placeholder: 'Enter MusicBrainz ID' },
    },
    recordings: {
        title: { label: 'Title', placeholder: 'Enter recording title' },
        recording_date: { label: 'Recording date', placeholder: 'e.g. 2020-05-15' },
        duration_seconds: { label: 'Duration', placeholder: 'e.g. 180 (seconds)' },
        musicbrainz_id: { label: 'MusicBrainz ID', placeholder: 'Enter MusicBrainz ID' },
    },
    releases: {
        title: { label: 'Title', placeholder: 'Enter release title' },
        release_date: { label: 'Release date', placeholder: 'e.g. 2020-01-01' },
        label: { label: 'Label', placeholder: 'e.g. Deutsche Grammophon' },
        catalog_number: { label: 'Catalogue number', placeholder: 'Enter catalogue number' },
        cover_dlink: { label: 'Cover image URL', placeholder: 'Paste image URL' },
        strmlk_spo: { label: 'Spotify URL', placeholder: 'Paste Spotify URL' },
        strmlk_apple: { label: 'Apple Music URL', placeholder: 'Paste Apple Music URL' },
        strmlk_tid: { label: 'TIDAL URL', placeholder: 'Paste TIDAL URL' },
        genre: { label: 'Genre', placeholder: 'e.g. Classical, Baroque' },
    },
    tracklists: {
        title: { label: 'Title', placeholder: 'Enter tracklist title' },
        release_date: { label: 'Release date', placeholder: 'e.g. 2020-01-01' },
        label: { label: 'Label', placeholder: 'e.g. Deutsche Grammophon' },
        catalog_number: { label: 'Catalogue number', placeholder: 'Enter catalogue number' },
        cover_dlink: { label: 'Cover image URL', placeholder: 'Paste image URL' },
        strmlk_spo: { label: 'Spotify URL', placeholder: 'Paste Spotify URL' },
        strmlk_apple: { label: 'Apple Music URL', placeholder: 'Paste Apple Music URL' },
        strmlk_tid: { label: 'TIDAL URL', placeholder: 'Paste TIDAL URL' },
        genre: { label: 'Genre', placeholder: 'e.g. Classical, Baroque' },
    },
    tracklist_entries: {
        disc_number: { label: 'Disc number', placeholder: 'e.g. 1, 2' },
        track_number: { label: 'Track number', placeholder: 'e.g. 1, 2' },
        side: { label: 'Side', placeholder: 'e.g. A, B' },
    },
    catalogues: {
        code: { label: 'Code', placeholder: 'e.g. KV, RV, BWV' },
        name: { label: 'Name', placeholder: 'e.g. Köchel Verzeichnis' },
        composer_id: { label: 'Composer', placeholder: 'Select composer' },
    },
    catalogue_entries: {
        entry_no: { label: 'Entry number', placeholder: 'e.g. 207, 540a' },
    },
    work_composers: {
        is_primary: { label: 'Primary composer', placeholder: '0 or 1' },
    },
    recording_performers: {
        performance_role: { label: 'Role', placeholder: 'e.g. Solo, Conductor' },
        instrument: { label: 'Instrument', placeholder: 'e.g. Violin, Piano' },
    },
    recording_works: {
        movement: { label: 'Movement', placeholder: 'e.g. Allegro' },
        part_number: { label: 'Part number', placeholder: 'e.g. 1, 2' },
    },
    artist_roles: {
        role: { label: 'Role', placeholder: 'e.g. Composer, Performer' },
    },
    group_members: {
        role: { label: 'Role', placeholder: 'e.g. Member, Leader' },
    },
}

/**
 * Get field metadata for a given table and column.
 * Returns user-friendly label and placeholder.
 */
export function getFieldMeta(tableName: string, columnName: string): FieldMeta {
    // Check table-specific overrides first
    const tableFields = tableSpecificFields[tableName]
    if (tableFields?.[columnName]) {
        return tableFields[columnName]
    }

    // Fall back to common fields
    if (commonFields[columnName]) {
        return commonFields[columnName]
    }

    // Default: convert snake_case to Title Case
    const label = columnName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

    return {
        label,
        placeholder: `Enter ${label.toLowerCase()}`,
    }
}

/**
 * Get the label for a field.
 */
export function getFieldLabel(tableName: string, columnName: string): string {
    return getFieldMeta(tableName, columnName).label
}

/**
 * Get the placeholder for a field.
 */
export function getFieldPlaceholder(tableName: string, columnName: string): string {
    return getFieldMeta(tableName, columnName).placeholder
}

/**
 * Get the help text for a field.
 */
export function getFieldHelpText(tableName: string, columnName: string): string | undefined {
    return getFieldMeta(tableName, columnName).helpText
}

/**
 * Sort columns according to the table's fieldOrder configuration.
 * Fields listed in fieldOrder appear first, in that order.
 * Fields not listed appear after, in their original schema order.
 * Hidden fields (per hiddenFields config) are filtered out.
 */
export function sortColumnsByFieldOrder<T extends { name: string }>(
    tableName: string,
    columns: T[]
): T[] {
    const order = fieldOrder[tableName]
    const hidden = hiddenFields[tableName] || []
    const hiddenSet = new Set(hidden)

    // Filter out hidden fields first
    const visibleColumns = columns.filter(col => !hiddenSet.has(col.name))

    if (!order) return visibleColumns

    const orderMap = new Map(order.map((name, index) => [name, index]))

    return [...visibleColumns].sort((a, b) => {
        const aIndex = orderMap.get(a.name) ?? Number.MAX_SAFE_INTEGER
        const bIndex = orderMap.get(b.name) ?? Number.MAX_SAFE_INTEGER
        return aIndex - bIndex
    })
}

/**
 * Check if a field is explicitly hidden for a table.
 */
export function isFieldHidden(tableName: string, columnName: string): boolean {
    const hidden = hiddenFields[tableName]
    return hidden ? hidden.includes(columnName) : false
}

/**
 * Check if a column should be hidden in the table listing view.
 * These columns are still visible in Add/Edit forms.
 */
export function isColumnHiddenInTable(tableName: string, columnName: string): boolean {
    const hidden = tableHiddenColumns[tableName]
    return hidden ? hidden.includes(columnName) : false
}

/**
 * Check if a primary key column should remain visible in the table listing view.
 * By default, PK columns ending with _id are hidden. This config overrides that.
 */
export function isPkColumnVisibleInTable(tableName: string, columnName: string): boolean {
    const visible = tableVisiblePkColumns[tableName]
    return visible ? visible.includes(columnName) : false
}

/**
 * Filter columns for table listing view, removing developer-heavy columns.
 */
export function filterColumnsForTable<T extends { name: string }>(
    tableName: string,
    columns: T[]
): T[] {
    const hidden = tableHiddenColumns[tableName]
    if (!hidden) return columns
    const hiddenSet = new Set(hidden)
    return columns.filter(col => !hiddenSet.has(col.name))
}
