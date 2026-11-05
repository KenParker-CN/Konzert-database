import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'
import type {Locale} from '@/lib/i18n/config'

const DETAIL_LABEL_KEYS = new Map<string, string>([
    ['catalogue', 'works.catalogue'],
    ['opus', 'works.opus'],
    ['title', 'works.titleColumn'],
    ['date', 'works.date'],
    ['genre', 'works.genre'],
    ['key', 'works.key'],
    ['instrumentation', 'works.instrumentation'],
    ['work structure', 'works.workStructure'],
    ['note', 'works.note'],
    ['german title', 'works.germanTitle'],
    ['nickname', 'works.nickname'],
    ['date_begin', 'works.dateBegin'],
    ['date_end', 'works.dateEnd'],
    ['other catalogue references', 'works.otherCatalogueReferences'],
    ['vocal title', 'works.vocalTitle'],
    ['tempo', 'works.tempo'],
    ['meter', 'works.meter'],
    ['measures', 'works.measures'],
    ['genres', 'works.genres'],
    ['creation location', 'works.creationLocation'],
])

const FULL_WIDTH_FIELDS = new Set(['workparts', 'work structure', 'movement', 'movements', 'section', 'instrumentation', 'instrmentation', 'note', 'rec_recmd'])

export function getWorkDetailFields(details: Record<string, string>, catalogCode: string | undefined): [string, string][] {
    return Object.entries(details).filter(([field]) => {
        const normalizedField = field.toLocaleLowerCase()
        if (normalizedField === 'catalogue') return false
        // Opus is already shown in the header description line.
        if (normalizedField === 'opus') return false
        // Key is shown as a colored badge next to the title in the header.
        if (normalizedField === 'key') return false
        // Title is already shown as the dialog title above.
        if (normalizedField === 'title') return false
        // Genre is shown as a colored badge next to the title in the header.
        if (normalizedField === 'genre' || normalizedField === 'type') return false
        // Subtitle is rendered inline next to the dialog title in italics.
        if (normalizedField === 'subtitle') return false
        // WikiQID is used to fetch the Wikipedia introduction, not shown as a field.
        if (normalizedField === 'wikiqid') return false
        // The KV id is shown as an external link beside the dialog title.
        if (catalogCode === 'KV' && normalizedField === 'id') return false
        if (catalogCode === 'Helm' && ['wotquenne', 'wq', 'helm', 'h'].includes(normalizedField)) return false
        // Kirkpatrick's numbering columns (Kk., Longo, Pestelli) are already shown
        // in the dialog header as catalogue and secondary catalogue numbers.
        if (catalogCode === 'Kirkpatrick' && ['kirkpatrick', 'longo', 'pestelli', 'sort_kk'].includes(normalizedField)) return false
        // The CNW sheet carries the older FS numbering next to the CNW numbers.
        return !(catalogCode === 'CNW' && normalizedField === 'fs')
    })
}

export function getWorkDetailLabelKey(field: string): string | undefined {
    return DETAIL_LABEL_KEYS.get(field.toLocaleLowerCase())
}

export function isFullWidthWorkDetail(field: string): boolean {
    return FULL_WIDTH_FIELDS.has(field.toLocaleLowerCase())
}

export function formatWorkDetailValue(field: string, value: string, locale: Locale): string {
    switch (field.toLocaleLowerCase()) {
        case 'genre':
        case 'type':
            return getLocalizedWorkTerm(value, 'type', locale)
        case 'key':
            return getLocalizedWorkTerm(value, 'key', locale)
        case 'instrumentation':
        case 'instrmentation':
            return getLocalizedWorkTerm(value, 'instrumentation', locale)
        default:
            return value
    }
}
