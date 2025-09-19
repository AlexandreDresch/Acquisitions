import config from './config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

const neonClient = neon(config.databaseUrl)
const db = drizzle(neonClient)

export { db, neonClient }
