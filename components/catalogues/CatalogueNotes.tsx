type CatalogueNoteEntry = {
    code: string
    description: string
}

type MwvRow = {
    entry: CatalogueNoteEntry
    subgroup?: string
}

type MwvGroup = {
    title: string
    rows: MwvRow[]
}

export type CatalogueNotesLabels = Record<
    | 'mainGroup' | 'group' | 'otherRanges' | 'specialRange' | 'mwv' | 'classification' | 'otherEntries'
    | 'vocalMusic' | 'sacredVocalMusic' | 'secularVocalMusic' | 'stageMusic' | 'instrumentalMusic'
    | 'orchestralMusic' | 'chamberMusic' | 'pianoMusic' | 'organMusic' | 'canons' | 'varia'
    | 'acappellaWorks' | 'singersWorks' | 'singersAndPianoWorks', string>

const mwvRangeDefinitions = [
    {labelKey: 'acappellaWorks', codes: ['F', 'G'], column: 0},
    {labelKey: 'singersWorks', codes: ['H', 'I', 'J', 'K'], column: 0},
    {labelKey: 'singersAndPianoWorks', codes: ['J', 'K'], column: 1},
] as const

const mwvGroupDefinitions: {titleKey: keyof CatalogueNotesLabels; codes: string[]; subgroupByCode?: Record<string, keyof CatalogueNotesLabels>}[] = [
    {
        titleKey: 'vocalMusic',
        codes: [...'ABCDEFGHIJK'],
        subgroupByCode: {
            A: 'sacredVocalMusic', B: 'sacredVocalMusic', C: 'sacredVocalMusic',
            D: 'secularVocalMusic', E: 'secularVocalMusic', F: 'secularVocalMusic', G: 'secularVocalMusic',
            H: 'secularVocalMusic', I: 'secularVocalMusic', J: 'secularVocalMusic', K: 'secularVocalMusic',
        },
    },
    {titleKey: 'stageMusic', codes: ['L', 'M']},
    {
        titleKey: 'instrumentalMusic',
        codes: [...'NOPQRSTUVW'],
        subgroupByCode: {
            N: 'orchestralMusic', O: 'orchestralMusic', P: 'orchestralMusic',
            Q: 'chamberMusic', R: 'chamberMusic',
            S: 'pianoMusic', T: 'pianoMusic', U: 'pianoMusic',
            V: 'organMusic', W: 'organMusic',
        },
    },
    {titleKey: 'canons', codes: ['X', 'Y']},
    {titleKey: 'varia', codes: ['Z']},
]

function parseEntries(notes: string): CatalogueNoteEntry[] | null {
    const entries = notes.split(/\r?\n/).map(line => {
        const separator = line.indexOf('\t')
        if (separator < 1) return null
        return {
            code: line.slice(0, separator).trim(),
            description: line.slice(separator + 1).trim(),
        }
    })

    return entries.length > 0 && entries.every((entry): entry is CatalogueNoteEntry => Boolean(entry?.code && entry.description))
        ? entries
        : null
}

function buildMwvGroups(entries: CatalogueNoteEntry[], labels: CatalogueNotesLabels): MwvGroup[] {
    const entriesByCode = new Map(entries.map(entry => [entry.code, entry]))
    return mwvGroupDefinitions.flatMap(definition => {
        const rows = definition.codes.flatMap(code => {
            const entry = entriesByCode.get(code)
            if (!entry) return []
            return [{
                entry,
                subgroup: definition.subgroupByCode?.[code] ? labels[definition.subgroupByCode[code]] : undefined,
            }]
        })
        return rows.length > 0 ? [{title: labels[definition.titleKey], rows}] : []
    })
}

function rowSpanForSubgroup(rows: MwvRow[], rowIndex: number) {
    const subgroup = rows[rowIndex].subgroup
    if (!subgroup) return 1
    if (rowIndex > 0 && rows[rowIndex - 1].subgroup === subgroup) return 0
    let span = 1
    while (rowIndex + span < rows.length && rows[rowIndex + span].subgroup === subgroup) span++
    return span
}

function renderRangeCell(group: MwvGroup, rowIndex: number, column: 0 | 1, labels: CatalogueNotesLabels) {
    const code = group.rows[rowIndex].entry.code
    const range = mwvRangeDefinitions.find(item => item.column === column && item.codes[0] === code)
    if (range) {
        return (
            <td rowSpan={range.codes.length} className="wrap-break-word border border-slate-200 px-2 py-2 align-middle text-slate-500">
                {labels[range.labelKey]}
            </td>
        )
    }

    const covered = mwvRangeDefinitions.some(item => item.column === column && item.codes.includes(code))
    return covered ? null : <td className="border border-slate-200 px-2 py-2" />
}

function MwvTable({groups, labels}: {groups: MwvGroup[]; labels: CatalogueNotesLabels}) {
    return (
        <table className="hidden w-full table-fixed border-collapse text-left text-xs md:table">
            <colgroup>
                <col className="w-[19%]" />
                <col className="w-[18%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
                <col className="w-[6%]" />
                <col className="w-[25%]" />
            </colgroup>
            <thead className="bg-slate-100 text-slate-700">
                <tr>
                    <th scope="col" className="border border-slate-200 px-3 py-2 font-semibold">{labels.mainGroup}</th>
                    <th scope="col" className="border border-slate-200 px-3 py-2 font-semibold">{labels.group}</th>
                    <th scope="col" className="border border-slate-200 px-3 py-2 font-semibold">{labels.otherRanges}</th>
                    <th scope="col" className="border border-slate-200 px-3 py-2 font-semibold">{labels.specialRange}</th>
                    <th scope="col" className="border border-slate-200 px-2 py-2 text-center font-semibold">{labels.mwv}</th>
                    <th scope="col" className="border border-slate-200 px-3 py-2 font-semibold">{labels.classification}</th>
                </tr>
            </thead>
            <tbody>
                {groups.map(group => group.rows.map((row, rowIndex) => (
                    <tr key={row.entry.code} className={rowIndex === 0 ? 'border-t-2 border-slate-300' : ''}>
                        {rowIndex === 0 && (
                            <th scope="rowgroup" rowSpan={group.rows.length} className="wrap-break-word border border-slate-200 bg-blue-50/70 px-3 py-3 text-center align-middle font-semibold text-slate-900">
                                {group.title}
                            </th>
                        )}
                        {row.subgroup && rowSpanForSubgroup(group.rows, rowIndex) > 0 && (
                            <th scope="rowgroup" rowSpan={rowSpanForSubgroup(group.rows, rowIndex)} className="wrap-break-word border border-slate-200 bg-slate-50 px-3 py-2 text-center align-middle font-medium text-slate-700">
                                {row.subgroup}
                            </th>
                        )}
                        {!row.subgroup && <td className="border border-slate-200 px-3 py-2" />}
                        {renderRangeCell(group, rowIndex, 0, labels)}
                        {renderRangeCell(group, rowIndex, 1, labels)}
                        <th scope="row" className="border border-slate-200 px-2 py-2 text-center font-semibold text-slate-900">{row.entry.code}</th>
                        <td className="wrap-break-word border border-slate-200 px-3 py-2 text-slate-700">{row.entry.description}</td>
                    </tr>
                )))}
            </tbody>
        </table>
    )
}

function MwvCards({groups, labels}: {groups: MwvGroup[]; labels: CatalogueNotesLabels}) {
    return (
        <div className="space-y-3 md:hidden">
            {groups.map(group => (
                <section key={group.title} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <h5 className="bg-blue-50 px-3 py-2 text-xs font-semibold text-slate-900">{group.title}</h5>
                    <div className="divide-y divide-slate-200">
                        {group.rows.map(row => (
                            <article key={row.entry.code} className="min-w-0 p-3">
                                <div className="mb-1 flex items-start justify-between gap-2">
                                    {row.subgroup && <p className="min-w-0 wrap-break-word text-xs font-medium text-slate-700">{row.subgroup}</p>}
                                    <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-900">{row.entry.code}</span>
                                </div>
                                {mwvRangeDefinitions.filter(range => range.codes[0] === row.entry.code).map(range => (
                                    <p key={range.labelKey} className="mb-1 wrap-break-word text-[11px] text-blue-700">{labels[range.labelKey]}</p>
                                ))}
                                <p className="wrap-break-word text-xs leading-relaxed text-slate-600">{row.entry.description}</p>
                            </article>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    )
}

function GroupedEntries({entries, labels}: {entries: CatalogueNoteEntry[]; labels: CatalogueNotesLabels}) {
    const groups = buildMwvGroups(entries, labels)
    const usedCodes = new Set(groups.flatMap(group => group.rows.map(row => row.entry.code)))
    const ungrouped = entries.filter(entry => !usedCodes.has(entry.code))

    return (
        <div className="min-w-0">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <MwvTable groups={groups} labels={labels} />
                <MwvCards groups={groups} labels={labels} />
            </div>
            {ungrouped.length > 0 && (
                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <h5 className="bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900">{labels.otherEntries}</h5>
                    <EntryTable entries={ungrouped} />
                </div>
            )}
        </div>
    )
}

function EntryTable({entries}: {entries: CatalogueNoteEntry[]}) {
    return (
        <table className="w-full table-fixed text-left text-xs">
            <colgroup><col /><col className="w-14 sm:w-20" /></colgroup>
            <tbody className="divide-y divide-slate-200">
                {entries.map(entry => (
                    <tr key={entry.code}>
                        <td className="wrap-break-word px-3 py-2 text-slate-600">{entry.description}</td>
                        <th scope="row" className="wrap-break-word px-2 py-2 text-right font-semibold text-slate-900">{entry.code}</th>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export default function CatalogueNotes({catalogueCode, notes, labels}: {catalogueCode: string; notes: string; labels: CatalogueNotesLabels}) {
    const entries = parseEntries(notes)
    if (!entries) return <p className="whitespace-pre-line text-slate-600">{notes}</p>

    if (catalogueCode === 'MWV') return <GroupedEntries entries={entries} labels={labels} />

    return (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <EntryTable entries={entries} />
        </div>
    )
}
