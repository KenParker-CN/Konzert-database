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

type WorkGroupDefinition = {
    key: string
    label: string
    children?: WorkGroupDefinition[]
}

const mendelssohnGroups: WorkGroupDefinition[] = [
    {
        key: 'mwv-vocal',
        label: '1. Vokalmusik',
        children: [
            {
                key: 'mwv-sacred',
                label: '1. Geistliche Vokalmusik',
                children: [
                    {
                        key: 'mwv-a',
                        label: 'A. Groß besetzte geistliche Vokalwerke, Werke für Solostimmen, Chor und Orchester bzw. Chor und Orchester',
                    },
                    {
                        key: 'mwv-b',
                        label: 'B. Kleiner besetzte geistliche Vokalwerke, Werke für Chor a cappella oder mit Begleitung von wenigen Instrumenten oder einem Instrument, auch mit Solostimmen',
                    },
                    {key: 'mwv-c', label: 'C. Geistliche Werke für Solostimmen mit Begleitung'},
                ],
            },
            {
                key: 'mwv-secular',
                label: '2. Weltliche Vokalmusik',
                children: [
                    {
                        key: 'mwv-d',
                        label: 'D. Groß besetzte weltliche Vokalwerke, Werke für Solostimmen, Chor und Orchester bzw. Chor und Orchester',
                    },
                    {key: 'mwv-e', label: 'E. Kleiner besetzte weltliche Vokalwerke, Werke mit Chor und Klavierbegleitung'},
                ],
            },
            {
                key: 'mwv-a-cappella',
                label: '3. A-cappella-Werke',
                children: [
                    {key: 'mwv-f', label: 'F. Werke für gemischten Chor bzw. Solistenensemble'},
                    {key: 'mwv-g', label: 'G. Werke für Männerchor bzw. Männerstimmen'},
                ],
            },
            {
                key: 'mwv-voices',
                label: '4. Werke für Singstimmen',
                children: [
                    {key: 'mwv-h', label: 'H. Werke für eine Singstimme und Orchester'},
                    {key: 'mwv-i', label: 'I. Werke für eine Singstimme und Instrumentalensemble'},
                ],
            },
            {
                key: 'mwv-voices-piano',
                label: '5. Werke für Singstimmen und Klavier',
                children: [
                    {key: 'mwv-j', label: 'J. Werke für zwei Singstimmen und Klavier (Duette)'},
                    {key: 'mwv-k', label: 'K. Werke für eine Singstimme und Klavier'},
                ],
            },
        ],
    },
    {
        key: 'mwv-stage',
        label: '2. Bühnenmusik',
        children: [
            {key: 'mwv-l', label: '1. L. Singspiele und Opern'},
            {key: 'mwv-m', label: '2. M. Schauspielmusiken und andere Bühnenwerke'},
        ],
    },
    {
        key: 'mwv-instrumental',
        label: '3. Instrumentalmusik',
        children: [
            {
                key: 'mwv-orchestral',
                label: '1. Orchestermusik',
                children: [
                    {key: 'mwv-n', label: 'N. Sinfonien'},
                    {key: 'mwv-o', label: 'O. Konzerte und konzertante Werke'},
                    {key: 'mwv-p', label: 'P. Ouvertüren und andere Orchesterwerke'},
                ],
            },
            {
                key: 'mwv-chamber',
                label: '2. Kammermusik',
                children: [
                    {key: 'mwv-q', label: 'Q. Kammermusikalische Werke mit Klavier'},
                    {key: 'mwv-r', label: 'R. Kammermusikalische Werke ohne Klavier'},
                ],
            },
            {
                key: 'mwv-piano',
                label: '3. Klaviermusik',
                children: [
                    {key: 'mwv-s', label: 'S. Werke für zwei Klaviere'},
                    {key: 'mwv-t', label: 'T. Werke für Klavier zu vier Händen'},
                    {key: 'mwv-u', label: 'U. Werke für Klavier zu zwei Händen'},
                ],
            },
            {
                key: 'mwv-organ',
                label: '4. Orgelmusik',
                children: [
                    {key: 'mwv-v', label: 'V. Orgelwerk für zwei Spieler'},
                    {key: 'mwv-w', label: 'W. Orgelwerke für einen Spieler'},
                ],
            },
        ],
    },
    {
        key: 'mwv-misc',
        label: '4. Miscellanea',
        children: [
            {key: 'mwv-x', label: 'X. Vokalkanons'},
            {key: 'mwv-y', label: 'Y. Instrumentalkanons'},
            {key: 'mwv-z', label: 'Z. Varia'},
        ],
    },
]

const telemannGroups: WorkGroupDefinition[] = [
    {
        key: 'twv-vocal',
        label: 'TWV 1–25 Vokalwerke (TVWV)',
        children: [
            {key: 'twv-1', label: 'TWV 1: Kirchenmusik zum gottesdienstlichen Gebrauch'},
            {key: 'twv-2', label: 'TWV 2: Musik zu Kircheneinweihungen'},
            {key: 'twv-3', label: 'TWV 3: Musik zu Einführungen von Predigern'},
            {key: 'twv-4', label: 'TWV 4: Musik zu Traueranlässen'},
            {key: 'twv-5', label: 'TWV 5: Passionsoratorien und Evangelienpassionen'},
            {key: 'twv-6', label: 'TWV 6: Geistliche Oratorien und verwandte Kompositionen'},
            {key: 'twv-7', label: 'TWV 7: Psalmvertonungen'},
            {key: 'twv-8', label: 'TWV 8: Motetten'},
            {key: 'twv-9', label: 'TWV 9: Messkompositionen, Magnificat und Einzelsätze'},
            {key: 'twv-10', label: 'TWV 10: Choralbuch und Sammlungen geistlicher Kompositionen'},
            {key: 'twv-11', label: 'TWV 11: Musik zu Hochzeiten'},
            {key: 'twv-12', label: 'TWV 12: Musik zu Geburten und Geburtstagen'},
            {key: 'twv-13', label: 'TWV 13: Musik zu politischen Feiern'},
            {key: 'twv-14', label: 'TWV 14: Musik für Hamburger und Altonaer Schulen'},
            {key: 'twv-15', label: 'TWV 15: Kapitänsmusiken (Oratorios und Serenaten)'},
            {key: 'twv-20', label: 'TWV 20: Weltliche Kantaten'},
            {key: 'twv-21', label: 'TWV 21: Opern'},
            {key: 'twv-22', label: 'TWV 22: Einlagesätze zu Opern anderer Komponisten'},
            {key: 'twv-23', label: 'TWV 23: Prologe zu Opern'},
            {key: 'twv-24', label: 'TWV 24: Musik zu Hamburger Fest-Anlässen'},
            {key: 'twv-25', label: 'TWV 25: Lehrwerke, Oden und Lieder'},
        ],
    },
    {
        key: 'twv-instrumental',
        label: 'TWV 30–55 Instrumentalwerke',
        children: [
            {
                key: 'twv-keyboard',
                label: 'TWV 30–39 Werke für Tasteninstrumente und Laute',
                children: [
                    {key: 'twv-30', label: 'TWV 30: Fugen'},
                    {key: 'twv-31', label: 'TWV 31: Choralvorspiele'},
                    {key: 'twv-32', label: 'TWV 32: Suiten'},
                    {key: 'twv-33', label: 'TWV 33: Fantasien, Sonaten, Concerti'},
                    {key: 'twv-34', label: 'TWV 34: Menuett-Sammlungen'},
                    {key: 'twv-35', label: 'TWV 35: Einzelstücke'},
                    {key: 'twv-36', label: 'TWV 36: Sammelhandschrift D-Mbs, Mus.ms. 1579'},
                    {key: 'twv-37', label: 'TWV 37: Lustiger Mischmasch'},
                    {key: 'twv-39', label: 'TWV 39: Werke für Laute'},
                ],
            },
            {
                key: 'twv-chamber',
                label: 'TWV 40–45 Kammermusik',
                children: [
                    {key: 'twv-40', label: 'TWV 40: Kammermusik ohne B.c.'},
                    {key: 'twv-41', label: 'TWV 41: Kammermusik für 1 Instrument und B.c.'},
                    {key: 'twv-42', label: 'TWV 42: Kammermusik für 2 Instrumente und B.c.'},
                    {key: 'twv-43', label: 'TWV 43: Kammermusik für 3 Instrumente und B.c.'},
                    {key: 'twv-44', label: 'TWV 44: Kammermusik für 4 und mehr Instrumente und B.c.'},
                    {key: 'twv-45', label: 'TWV 45: Polnische Tänze aus der Handschrift Rostock'},
                ],
            },
            {
                key: 'twv-orchestral',
                label: 'TWV 50–55 Orchestermusik',
                children: [
                    {key: 'twv-50', label: 'TWV 50: Sinfonien, Divertimenti, Märsche'},
                    {key: 'twv-51', label: 'TWV 51: Konzerte für 1 Soloinstrument und Begleitung'},
                    {key: 'twv-52', label: 'TWV 52: Konzerte für 2 Soloinstrumente und Begleitung'},
                    {key: 'twv-53', label: 'TWV 53: Konzerte für 3 Soloinstrumente und Begleitung'},
                    {key: 'twv-54', label: 'TWV 54: Konzerte für 4 Soloinstrumente, Streicher und B.c. sowie Gruppenkonzerte'},
                    {key: 'twv-55', label: 'TWV 55: Ouverturensuiten'},
                ],
            },
        ],
    },
]

const mendelssohnGroupByLetter = new Map<string, WorkGroupDefinition>()

function indexMendelssohnGroups(groups: WorkGroupDefinition[]) {
    for (const group of groups) {
        const match = /^mwv-([a-z])$/.exec(group.key)
        if (match) mendelssohnGroupByLetter.set(match[1].toUpperCase(), group)
        if (group.children) indexMendelssohnGroups(group.children)
    }
}

indexMendelssohnGroups(mendelssohnGroups)

function getMendelssohnLetter(catalogue: string): string | null {
    return /^MWV\s+([A-Z])\d/i.exec(catalogue)?.[1].toUpperCase() ?? null
}

function createMendelssohnGroups(works: ComposerWork[]): WorkCategoryGroup[] {
    const workByLetter = new Map<string, ComposerWork[]>()
    const otherWorks: ComposerWork[] = []

    for (const work of works) {
        const letter = getMendelssohnLetter(work.catalogue)
        if (!letter || !mendelssohnGroupByLetter.has(letter)) {
            otherWorks.push(work)
            continue
        }
        const letterWorks = workByLetter.get(letter) ?? []
        letterWorks.push(work)
        workByLetter.set(letter, letterWorks)
    }

    function createNodes(definitions: WorkGroupDefinition[]): WorkCategoryGroup[] {
        return definitions.flatMap(definition => {
            const letter = /^mwv-([a-z])$/.exec(definition.key)?.[1].toUpperCase()
            const children = definition.children ? createNodes(definition.children) : undefined
            const worksForGroup = letter ? workByLetter.get(letter) ?? [] : []
            if (!worksForGroup.length && !children?.length) return []

            const group: WorkCategoryGroup = {
                key: definition.key,
                label: definition.label,
                works: worksForGroup,
                ...(children?.length ? {children} : {}),
            }
            return [group]
        })
    }

    const groups = createNodes(mendelssohnGroups)
    if (otherWorks.length) {
        groups.push({
            key: 'mwv-unclassified',
            label: 'Weitere Werke (ohne MWV-Nummer)',
            works: otherWorks,
        })
    }
    return groups
}

function getTelemannNumber(catalogue: string): number | null {
    const match = /^TWV\s+(?:Anh\.?\s*)?(\d{1,2})(?=\s|:|$)/i.exec(catalogue)
    return match ? Number(match[1]) : null
}

function createTelemannGroups(works: ComposerWork[]): WorkCategoryGroup[] {
    const worksByNumber = new Map<number, ComposerWork[]>()
    const otherWorks: ComposerWork[] = []

    for (const work of works) {
        const number = getTelemannNumber(work.catalogue)
        if (number === null) {
            otherWorks.push(work)
            continue
        }
        const numberWorks = worksByNumber.get(number) ?? []
        numberWorks.push(work)
        worksByNumber.set(number, numberWorks)
    }

    function createNodes(definitions: WorkGroupDefinition[]): WorkCategoryGroup[] {
        return definitions.flatMap(definition => {
            const number = /^twv-(\d+)$/.exec(definition.key)?.[1]
            const children = definition.children ? createNodes(definition.children) : undefined
            const groupWorks = number ? worksByNumber.get(Number(number)) ?? [] : []
            if (!groupWorks.length && !children?.length) return []

            return [{
                key: definition.key,
                label: definition.label,
                works: groupWorks,
                ...(children?.length ? {children} : {}),
            }]
        })
    }

    const groups = createNodes(telemannGroups)
    if (otherWorks.length) {
        groups.push({
            key: 'twv-unclassified',
            label: 'TWV deest / ohne Gruppennummer',
            works: otherWorks,
        })
    }
    return groups
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
    const mendelssohnWorks: ComposerWork[] = []
    const telemannWorks: ComposerWork[] = []

    for (const work of works) {
        if (catalogCode === 'MWV') {
            mendelssohnWorks.push(work)
            continue
        }
        if (catalogCode === 'TWV') {
            telemannWorks.push(work)
            continue
        }

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
    if (mendelssohnWorks.length > 0) {
        result.unshift(...createMendelssohnGroups(mendelssohnWorks))
    }
    if (telemannWorks.length > 0) {
        result.unshift(...createTelemannGroups(telemannWorks))
    }
    if (uncategorized.length > 0) {
        result.push({key: OTHER_CATEGORY_KEY, label: '', works: uncategorized})
    }
    return result
}
