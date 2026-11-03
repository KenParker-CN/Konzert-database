#!/usr/bin/env node
import {readFile, writeFile} from 'node:fs/promises'

const args = process.argv.slice(2)
const csvPath = args[0]
const langIndex = args.indexOf('--lang')
const outIndex = args.indexOf('--out')
const lang = langIndex >= 0 ? args[langIndex + 1] : 'en'
const outPath = outIndex >= 0 ? args[outIndex + 1] : 'data/wikiqid-candidates.csv'

if (!csvPath || csvPath.startsWith('--')) {
    console.error('Usage: node scripts/fetch-wikiqid.mjs <catalogue.csv> [--lang en] [--out file.csv]')
    process.exit(1)
}

function parseCsv(text) {
    const rows = []
    let row = []
    let field = ''
    let inQuotes = false
    for (let i = 0; i < text.length; i++) {
        const c = text[i]
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    field += '"'
                    i++
                } else {
                    inQuotes = false
                }
            } else {
                field += c
            }
        } else if (c === '"') {
            inQuotes = true
        } else if (c === ',') {
            row.push(field)
            field = ''
        } else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') i++
            row.push(field)
            rows.push(row)
            row = []
            field = ''
        } else {
            field += c
        }
    }
    if (field || row.length) {
        row.push(field)
        rows.push(row)
    }
    const [header, ...body] = rows
    const keys = header.map(h => h.trim())
    return body.map(cells => Object.fromEntries(keys.map((key, i) => [key, (cells[i] ?? '').trim()])))
}

async function lookupBatch(titles) {
    const params = new URLSearchParams({
        action: 'query',
        prop: 'pageprops',
        ppprop: 'wikibase_item',
        redirects: '1',
        format: 'json',
        formatversion: '2',
        titles: titles.join('|'),
    })
    const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?${params}`, {
        headers: {'User-Agent': 'konzert-database-wikiqid-script/1.0'},
    })
    if (!res.ok) throw new Error(`Wikipedia API returned HTTP ${res.status}`)
    const data = await res.json()

    const aliases = new Map()
    for (const {from, to} of [...(data.query.normalized ?? []), ...(data.query.redirects ?? [])]) {
        aliases.set(from, to)
    }
    const pages = new Map((data.query.pages ?? []).map(page => [page.title, page]))

    return titles.map(title => {
        let resolved = title
        for (let i = 0; i < 3 && aliases.has(resolved); i++) resolved = aliases.get(resolved)
        const page = pages.get(resolved)
        const qid = page && !page.missing ? page.pageprops?.wikibase_item ?? '' : ''
        return [title, qid]
    })
}

const csvText = (await readFile(csvPath, 'utf8')).replace(/^\uFEFF/, '')
const works = parseCsv(csvText).filter(work => work.Title && !work.WikiQID)
const titles = [...new Set(works.map(work => work.Title))]

const qidByTitle = new Map()
const batchSize = 50
for (let i = 0; i < titles.length; i += batchSize) {
    const batch = titles.slice(i, i + batchSize)
    for (const [title, qid] of await lookupBatch(batch)) qidByTitle.set(title, qid)
    await new Promise(resolve => setTimeout(resolve, 300))
}

const escape = value => /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
const lines = [
    ['Opus', 'Title', 'Subtitle', 'Candidate WikiQID'].join(','),
    ...works.map(work => [
        work.Opus,
        work.Title,
        work.Subtitle,
        qidByTitle.get(work.Title) ?? '',
    ].map(escape).join(',')),
]
await writeFile(outPath, lines.join('\n') + '\n')

const found = works.filter(work => qidByTitle.get(work.Title)).length
console.log(`Checked ${works.length} works without WikiQID: ${found} candidates found, written to ${outPath}`)
