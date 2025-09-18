import express from 'express'

const app = express()

app.use(express.json({ limit: '50mb' })).use('/health', (_req, res) => res.status(200).send('OK'))

export default app
