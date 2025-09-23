import dotenv from 'dotenv'

dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` })

interface Config {
  port: number
  databaseUrl: string
  logLevel: string
  jwt: string
}

const config: Config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  databaseUrl: process.env.DATABASE_URL || '',
  logLevel: process.env.LOG_LEVEL || 'info',
  jwt: process.env.JWT_SECRET || 'your_jwt_secret_key',
}

export default config
