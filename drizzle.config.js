import config from './src/config/config.ts'

export default {
  schema: './src/models/*.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.databaseUrl,
  },
}
