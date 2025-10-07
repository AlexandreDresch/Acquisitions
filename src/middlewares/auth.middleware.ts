import { Request, Response, NextFunction } from 'express'
import { jwtToken } from '../utils/jwt.ts'
import { AuthenticatedUser } from '../types/express.ts'
import logger from '../config/logger.ts'

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token

    if (!token) {
      return next()
    }

    const decoded = jwtToken.verify(token) as AuthenticatedUser

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    }

    next()
  } catch (error) {
    try {
      logger.debug('Invalid token in auth middleware', { error })
    } catch (loggerError) {
      console.error('Logger failed in auth middleware:', loggerError)
    }
    next()
  }
}

export default authMiddleware
