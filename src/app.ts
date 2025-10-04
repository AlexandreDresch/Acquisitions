import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import logger from './config/logger.ts'
import authRoutes from './routes/auth.routes.ts'
import usersRoutes from './routes/users.routes.ts'
import errorMiddleware from './middlewares/error.middleware.ts'
import securityMiddleware from './middlewares/security.middleware.ts'
import authMiddleware from './middlewares/auth.middleware.ts'
import { dealRoutes } from './routes/deal.routes.ts'

const app = express()

app
  .use(helmet())
  .use(cors())
  .use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))
  .use(authMiddleware as express.RequestHandler)
  .use(securityMiddleware)
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
  .use('/api/users', usersRoutes)
  .use('/api/deals', dealRoutes)
  .use((req, res) => {
    res.status(404).json({ message: 'Endpoint not found' })
  })
  .use(errorMiddleware)

export default app
