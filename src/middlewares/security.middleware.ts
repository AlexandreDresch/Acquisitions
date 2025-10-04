import { NextFunction, Request, Response } from 'express'
import aj from '../config/arcjet.ts'
import { slidingWindow } from '@arcjet/node'
import logger from '../config/logger.ts'

const securityMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const role = req.user?.role || 'guest'

    let limit
    let message

    switch (role) {
      case 'admin':
        limit = 20
        message = 'Admin rate limit exceeded. Please try again later.'
        break
      case 'user':
        limit = 10
        message = 'User rate limit exceeded. Please try again later.'
        break
      default:
        limit = 5
        message = 'Guest rate limit exceeded. Please try again later.'
    }

    const client = aj.withRule(slidingWindow({ interval: '1m', max: limit, mode: 'LIVE' }))

    const decision = await client.protect(req)

    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn(`Bot detected: ${decision.reason.toString()}`, {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
      })

      res.status(403).json({ success: false, message: 'Access denied: Bot detected.' })
      return
    }

    if (decision.isDenied() && decision.reason.isShield()) {
      logger.warn(`Request blocked by shield: ${decision.reason.toString()}`, {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
      })

      res.status(403).json({ success: false, message: 'Access denied by security shield.' })
      return
    }

    if (decision.isDenied()) {
      logger.warn(`Rate limit exceeded: ${decision.reason.toString()}`, {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
      })

      res.status(429).json({ success: false, message })
      return
    }

    next()
  } catch (error) {
    console.error('Security middleware error:', error)
    next()
  }
}

export default securityMiddleware
