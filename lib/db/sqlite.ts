import 'server-only'

import Database from 'better-sqlite3'
import path from 'node:path'

const databasePath = path.join(process.cwd(), 'identifier.sqlite')

export function getDatabase() {
  return new Database(databasePath, { readonly: true, fileMustExist: true })
}
