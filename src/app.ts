import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import logger from './config/logger.js'
import authRoutes from './routes/auth.routes.js'
import errorMiddleware from './middlewares/error.middleware.js'

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
    res
      .status(200)
      .json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() })
  })
  .use('/api/auth', authRoutes)
  .use(errorMiddleware)

export default app
