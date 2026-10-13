import type {ComposerWork} from '@/lib/db/composers'

export const OTHER_CATEGORY_KEY = 'other'

const categoryAliases: Record<string, string> = {
    'oratorio': 'Oratorio',
    'sinfonie': 'Sinfonia',
    'chorals': 'Chorale',
    'klavierstücke': 'Klavierstück',
    'fantaisia': 'Fantasia',
    'liedentwurf': 'Lied',
    'soante': 'Sonata',
    'serenta': 'Serenata',
    'tocatta': 'Toccata',
}

const haydnGroupNames: Record<string, string> = {
    I: 'Symphonien',
    Ia: 'Ouvertüren',
    II: 'Divertimenti für zwei Violinen, Viola, und Violoncello',
    III: 'Quartette für zwei Violinen, Viola und Violoncello',
    IV: 'Dreistimmige Divertimenti',
    V: 'Streichtrios',
    VI: 'Duos für verschiedene Instrumente',
    VII: 'Konzerte für verschiedene Instrumente',
    VIIa: 'Konzerte für Violine',
    VIIb: 'Konzerte für Violoncello',
    VIIc: 'Konzerte für Kontrabaß',
    VIId: 'Konzerte für Horn',
    VIIe: 'Konzerte für Trompete',
    VIIf: 'Konzerte für Flote',
    VIIg: 'Konzerte für Oboe',
    VIIh: 'Konzerte für Radleier ("Lyra organizzata")',
    VIII: 'Märsche',
    IX: 'Tänze',
    X: 'Werke für verschiedene Instrumente mit Baryton',
    XI: 'Trios für Baryton, Viola (oder Violine) und Violoncello',
    XII: 'Duos für Baryton, mit oder ohne Baß',
    XIII: 'Konzerte für Baryton',
    XIV: 'Mehrstimmige Divertimenti mit Klavier',
    XV: 'Trios für Klavier, Violine (oder Flöte) und Violoncello',
    XVI: 'Klaviersonaten',
    XVII: 'Klavierstücke',
    XVIIa: 'Stücke für Klavier zu vier Händen',
    XVIII: 'Klavierkonzerte',
    XIX: 'Stücke für ein Laufwerk (Flötenuhr)',
    XX: 'Die sieben letzten Worte unseres Erlösers am Kreuze',
    XXa: 'Stabat Mater',
    XXI: 'Oratorien',
    XXII: 'Messen',
    XXIIa: 'Requien',
    XXIIb: 'Libera',
    XXIII: 'Kleine Kirchenkompositionen',
    XXIIIa: 'Gradualien, Offertorien, Motetten',
    XXIIIb: 'Marianische Antiphonen',
    XXIIIc: 'Te Deum und andre Chöre',
    XXIIId: 'Anrie',
    XXIVa: 'Kantaten und Chöre mit Orchesterbegleitung',
    XXIVb: 'Arien mit Orchesterbegleitung',
    XXV: 'Zwei-, drei- und vierstimmige Gesänge',
    XXVI:'Lieder, Kantaten und Chöre',
    XXVIa: 'Lieder mit Klavierbegleitung',
    XXVIb: 'Kantaten und Chöre mit Begleitung eines Instruments',
    XXVII: 'Kanons',
    XXVIII: 'Opern',
    XXIX: 'Marionetten-Opern und Singspiele',
    XXX: 'Schauspielmusiken',
    XXXI: 'Bearbeitungen schottischer und walisischer Volkslieder und andere Bearbeitungen',
    XXXII: 'Pasticcios',
}

function getCategoryLabel(workType: string): string | null {
    const trimmed = workType.trim()
    if (!trimmed || trimmed === '#N/A') return null
    return categoryAliases[trimmed.toLocaleLowerCase()] ?? trimmed
}

function getHaydnGroup(catalogue: string): string | null {
    const group = /^Hob\.\s*([IVXLCDM]+)([a-z]?)(?=\s|:|$)/.exec(catalogue)
    return group ? `${group[1]}${group[2]}` : null
}

function romanToNumber(roman: string): number {
    const values: Record<string, number> = {I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000}
    let result = 0

    for (let index = 0; index < roman.length; index++) {
        const current = values[roman[index].toUpperCase()]
        const next = values[roman[index + 1]?.toUpperCase()] ?? 0
        result += current < next ? -current : current
    }
    return result
}

export type WorkCategoryGroup = {
    key: string
    label: string
    works: ComposerWork[]
    children?: WorkCategoryGroup[]
}

function compareHaydnGroupKeys(left: string, right: string): number {
    const leftMatch = /^([IVXLCDM]+)([a-z]*)$/.exec(left)
    const rightMatch = /^([IVXLCDM]+)([a-z]*)$/.exec(right)
    if (!leftMatch || !rightMatch) return left.localeCompare(right)

    return romanToNumber(leftMatch[1]) - romanToNumber(rightMatch[1])
        || leftMatch[2].localeCompare(rightMatch[2])
}

function createHaydnGroups(works: ComposerWork[]): WorkCategoryGroup[] {
    const roots: WorkCategoryGroup[] = []
    const groupsByKey = new Map<string, WorkCategoryGroup>()
    const orderedWorks = [...works].sort((left, right) =>
        compareHaydnGroupKeys(getHaydnGroup(left.catalogue) ?? '', getHaydnGroup(right.catalogue) ?? ''),
    )

    for (const work of orderedWorks) {
        const group = getHaydnGroup(work.catalogue)
        if (!group) continue

        const romanNumeral = /^([IVXLCDM]+)/.exec(group)?.[1]
        if (!romanNumeral) continue

        const hierarchy = [romanNumeral]
        for (let index = 1; index <= group.length - romanNumeral.length; index++) {
            hierarchy.push(`${romanNumeral}${group.slice(romanNumeral.length, romanNumeral.length + index)}`)
        }

        for (let index = 0; index < hierarchy.length; index++) {
            const key = `haydn-${hierarchy[index].toLocaleLowerCase()}`
            if (groupsByKey.has(key)) continue

            const label = `${hierarchy[index]}${haydnGroupNames[hierarchy[index]] ? `. ${haydnGroupNames[hierarchy[index]]}` : ''}`
            const node: WorkCategoryGroup = {key, label, works: []}
            groupsByKey.set(key, node)

            const parent = index > 0
                ? groupsByKey.get(`haydn-${hierarchy[index - 1].toLocaleLowerCase()}`)
                : undefined
            if (parent) {
                parent.children ??= []
                parent.children.push(node)
            } else {
                roots.push(node)
            }
        }

        groupsByKey.get(`haydn-${group.toLocaleLowerCase()}`)?.works.push(work)
    }

    return roots
}

export function groupWorksByCategory(works: ComposerWork[], catalogCode?: string): WorkCategoryGroup[] {
    const groups = new Map<string, WorkCategoryGroup>()
    const uncategorized: ComposerWork[] = []
    const haydnWorks: ComposerWork[] = []

    for (const work of works) {
        const haydnNumeral = catalogCode === 'Hob' ? getHaydnGroup(work.catalogue) : null
        if (haydnNumeral) {
            haydnWorks.push(work)
            continue
        }

        const label = getCategoryLabel(work.type)
        if (!label) {
            uncategorized.push(work)
            continue
        }

        const key = label.toLocaleLowerCase()
        const group = groups.get(key)
        if (group) {
            group.works.push(work)
        } else {
            groups.set(key, {key, label, works: [work]})
        }
    }

    const result = [...groups.values()].sort((left, right) => {
        return left.label.localeCompare(right.label, undefined, {sensitivity: 'base'})
    })
    if (haydnWorks.length > 0) {
        result.unshift(...createHaydnGroups(haydnWorks))
    }
    if (uncategorized.length > 0) {
        result.push({key: OTHER_CATEGORY_KEY, label: '', works: uncategorized})
    }
    return result
}
