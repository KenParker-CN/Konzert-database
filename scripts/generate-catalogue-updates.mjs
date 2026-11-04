import {execFileSync} from 'node:child_process'
import {readdirSync, writeFileSync} from 'node:fs'
import path from 'node:path'

const catalogueDir = path.join(process.cwd(), 'data', 'catalogues')
const updates = {}

for (const file of readdirSync(catalogueDir).filter(name => name.endsWith('.csv'))) {
    const commitDate = execFileSync('git', ['log', '-1', '--format=%cI', '--', path.join(catalogueDir, file)], {encoding: 'utf8'}).trim()
    if (commitDate) updates[file.slice(0, -'.csv'.length)] = new Date(commitDate).toISOString()
}

writeFileSync(path.join(process.cwd(), 'data', 'catalogue-updates.json'), `${JSON.stringify(updates, null, 2)}\n`)
