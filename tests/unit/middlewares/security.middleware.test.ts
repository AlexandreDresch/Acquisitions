/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express'
import securityMiddleware from '../../../src/middlewares/security.middleware.ts'
import logger from '../../../src/config/logger.ts'
import aj from '../../../src/config/arcjet.ts'
import { slidingWindow } from '@arcjet/node'

import { jest } from '@jest/globals'

jest.mock('@arcjet/node', () => ({
  shield: jest.fn(),
  detectBot: jest.fn(),
  slidingWindow: jest.fn(),
}))

jest.mock('../../../src/config/arcjet.ts', () => {
  return {
    __esModule: true,
    default: {
      withRule: jest.fn(),
      protect: jest.fn(),
    },
  }
})

jest.mock('../../../src/config/logger.ts', () => ({
  __esModule: true,
  default: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}))

const mockedAj = aj as jest.Mocked<typeof aj>
const mockedSlidingWindow = slidingWindow as jest.MockedFunction<typeof slidingWindow>
const mockedLogger = logger as jest.Mocked<typeof logger>

describe('securityMiddleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction
  let mockDecision: any

  beforeEach(() => {
    jest.clearAllMocks()

    req = {
      ip: '127.0.0.1',
      path: '/api/test',
      get: jest.fn((name: string) => {
        if (name === 'User-Agent') {
          return 'Mozilla/5.0'
        }
        return undefined
      }) as any,
      user: undefined,
    }

    res = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn() as any,
    }

    next = jest.fn()

    mockDecision = {
      isDenied: jest.fn(),
      reason: {
        isBot: jest.fn(),
        isShield: jest.fn(),
        toString: jest.fn().mockReturnValue('Mock reason'),
      },
    }

    mockedAj.withRule.mockReturnValue({
      protect: jest.fn().mockResolvedValue(mockDecision as unknown as never),
    } as any)

    mockedSlidingWindow.mockReturnValue({} as any)
  })

  describe('Rate limiting based on user role', () => {
    it('should use guest limits when no user is present', async () => {
      req.user = undefined

      await securityMiddleware(req as Request, res as Response, next)

      expect(mockedSlidingWindow).toHaveBeenCalledWith({
        interval: '1m',
        max: 5,
        mode: 'LIVE',
      })
      expect(mockedAj.withRule).toHaveBeenCalled()
    })

    it('should use user limits for user role', async () => {
      req.user = { role: 'user' }

      await securityMiddleware(req as Request, res as Response, next)

      expect(mockedSlidingWindow).toHaveBeenCalledWith({
        interval: '1m',
        max: 10,
        mode: 'LIVE',
      })
    })

    it('should use admin limits for admin role', async () => {
      req.user = { role: 'admin' }

      await securityMiddleware(req as Request, res as Response, next)

      expect(mockedSlidingWindow).toHaveBeenCalledWith({
        interval: '1m',
        max: 20,
        mode: 'LIVE',
      })
    })
  })

  describe('Bot detection', () => {
    it('should return 403 when bot is detected', async () => {
      mockDecision.isDenied.mockReturnValue(true)
      mockDecision.reason.isBot.mockReturnValue(true)
      mockDecision.reason.toString.mockReturnValue('Bot detected')

      await securityMiddleware(req as Request, res as Response, next)

      expect(mockedLogger.warn).toHaveBeenCalledWith('Bot detected: Bot detected', {
        ip: '127.0.0.1',
        path: '/api/test',
        userAgent: 'Mozilla/5.0',
      })
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied: Bot detected.',
      })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('Shield protection', () => {
    it('should return 403 when request is blocked by shield', async () => {
      mockDecision.isDenied.mockReturnValue(true)
      mockDecision.reason.isBot.mockReturnValue(false)
      mockDecision.reason.isShield.mockReturnValue(true)
      mockDecision.reason.toString.mockReturnValue('Shield blocked')

      await securityMiddleware(req as Request, res as Response, next)

      expect(mockedLogger.warn).toHaveBeenCalledWith('Request blocked by shield: Shield blocked', {
        ip: '127.0.0.1',
        path: '/api/test',
        userAgent: 'Mozilla/5.0',
      })
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied by security shield.',
      })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('Rate limiting', () => {
    it('should return 429 with guest message when guest rate limit is exceeded', async () => {
      req.user = undefined
      mockDecision.isDenied.mockReturnValue(true)
      mockDecision.reason.isBot.mockReturnValue(false)
      mockDecision.reason.isShield.mockReturnValue(false)
      mockDecision.reason.toString.mockReturnValue('Rate limit exceeded')

      await securityMiddleware(req as Request, res as Response, next)

      expect(mockedLogger.warn).toHaveBeenCalledWith('Rate limit exceeded: Rate limit exceeded', {
        ip: '127.0.0.1',
        path: '/api/test',
        userAgent: 'Mozilla/5.0',
      })
      expect(res.status).toHaveBeenCalledWith(429)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Guest rate limit exceeded. Please try again later.',
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should return 429 with user message when user rate limit is exceeded', async () => {
      req.user = { role: 'user' }
      mockDecision.isDenied.mockReturnValue(true)
      mockDecision.reason.isBot.mockReturnValue(false)
      mockDecision.reason.isShield.mockReturnValue(false)
      mockDecision.reason.toString.mockReturnValue('Rate limit exceeded')

      await securityMiddleware(req as Request, res as Response, next)

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User rate limit exceeded. Please try again later.',
      })
    })

    it('should return 429 with admin message when admin rate limit is exceeded', async () => {
      req.user = { role: 'admin' }
      mockDecision.isDenied.mockReturnValue(true)
      mockDecision.reason.isBot.mockReturnValue(false)
      mockDecision.reason.isShield.mockReturnValue(false)
      mockDecision.reason.toString.mockReturnValue('Rate limit exceeded')

      await securityMiddleware(req as Request, res as Response, next)

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Admin rate limit exceeded. Please try again later.',
      })
    })
  })

  describe('Successful requests', () => {
    it('should call next() when request is allowed', async () => {
      mockDecision.isDenied.mockReturnValue(false)

      await securityMiddleware(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
      expect(res.json).not.toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    it('should return 429 when arcjet throws an error', async () => {
      mockedAj.withRule.mockReturnValue({
        protect: jest.fn().mockRejectedValue(new Error('Arcjet error') as unknown as never),
      } as any)

      await securityMiddleware(req as Request, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(429)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Too many requests. Please try again later.',
      })
    })

    it('should log error when arcjet throws an error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      mockedAj.withRule.mockReturnValue({
        protect: jest.fn().mockRejectedValue(new Error('Arcjet error') as unknown as never),
      } as any)

      await securityMiddleware(req as Request, res as Response, next)

      expect(consoleSpy).toHaveBeenCalledWith('Security middleware error:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('Edge cases', () => {
    it('should handle missing user agent', async () => {
      req.get = jest.fn(() => undefined) as any

      mockDecision.isDenied.mockReturnValue(true)
      mockDecision.reason.isBot.mockReturnValue(true)
      mockDecision.reason.toString.mockReturnValue('Bot detected')

      await securityMiddleware(req as Request, res as Response, next)

      expect(mockedLogger.warn).toHaveBeenCalledWith('Bot detected: Bot detected', {
        ip: '127.0.0.1',
        path: '/api/test',
        userAgent: undefined,
      })
    })

    it('should handle undefined user role', async () => {
      req.user = { role: undefined }
      mockDecision.isDenied.mockReturnValue(false)

      await securityMiddleware(req as Request, res as Response, next)

      expect(mockedSlidingWindow).toHaveBeenCalledWith({
        interval: '1m',
        max: 5,
        mode: 'LIVE',
      })
    })
  })
})
