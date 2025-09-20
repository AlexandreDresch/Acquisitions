import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import logger from './config/logger.js'

const app = express()

app
  .use(helmet())
  .use(cors())
  .use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))
  .use(express.json({ limit: '50mb' }))
  .use(express.urlencoded({ extended: true }))
  .use(cookieParser())
  .get('/health', (_req, res) => {
    logger.info('Health check endpoint called')
    res.status(200).send('OK')
  })

export default app
