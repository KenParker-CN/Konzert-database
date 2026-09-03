import 'server-only'

import fs from 'node:fs'
import path from 'node:path'

export type Album = {
  id: string
  musicbrainzId: string
  title: string
  composers: string[]
  artists: string[]
  label: string
  catalogueNumber: string
  year: string
  country: string
  genre: string
  barcode: string
  trackCount: string
  cover: string
  spotify: string
  appleMusic: string
  tidal: string
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], cell = '', quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { cell += '"'; index += 1 } else quoted = !quoted
    } else if (char === ',' && !quoted) { row.push(cell); cell = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1
      row.push(cell); if (row.some(value => value)) rows.push(row); row = []; cell = ''
    } else cell += char
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows
}

function list(value: string) { return value.split(';').map(item => item.trim()).filter(Boolean) }

export function getAlbums(search?: string): Album[] {
  const file = path.join(process.cwd(), 'public/data/albums.csv')
  const rows = parseCsv(fs.readFileSync(file, 'utf8'))
  const dataRows = rows[0]?.[0] === 'id' ? rows.slice(1) : rows
  const albums = dataRows.map(row => ({
    id: row[0] ?? '', musicbrainzId: row[1] ?? '', title: row[2] ?? '', composers: list(row[3] ?? ''), artists: list(row[4] ?? ''),
    label: row[5] ?? '', catalogueNumber: row[6] ?? '', year: row[7] ?? '', country: row[8] ?? '', genre: row[9] ?? '', barcode: row[10] ?? '', trackCount: row[11] ?? '', cover: row[12] ?? '', spotify: row[13] ?? '', appleMusic: row[14] ?? '', tidal: row[15] ?? '',
  }))
  const query = search?.trim().toLowerCase()
  return query ? albums.filter(album => [album.title, ...album.composers, ...album.artists, album.label].some(value => value.toLowerCase().includes(query))) : albums
}

export function getAlbum(id: string) { return getAlbums().find(album => album.id === id) ?? null }
