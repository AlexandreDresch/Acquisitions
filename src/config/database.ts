import config from './config.ts'
import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

if (process.env.NODE_ENV === 'development') {
  neonConfig.fetchEndpoint = 'http://neon-local:5432/sql'
  neonConfig.useSecureWebSocket = false
  neonConfig.poolQueryViaFetch = true
}

const neonClient = neon(config.databaseUrl)
const db = drizzle(neonClient)

export { db, neonClient }
