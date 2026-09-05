import 'server-only'

import { createClient, type Client } from '@libsql/client'

let _client: Client | null = null

export function getDatabase(): Client {
  if (!_client) {
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:./identifier.sqlite',
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  }
  return _client
}
