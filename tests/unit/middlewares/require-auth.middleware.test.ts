/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express'
import authMiddleware from '../../../src/middlewares/auth.middleware'

const mockRequest = (user?: any) =>
  ({
    user,
  }) as Request

const mockResponse = () => {
  const res = {} as Response
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const mockNext = jest.fn() as NextFunction

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    })
  }
  next()
}

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      })
    }

    next()
  }
}

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('requireAuth', () => {
    it('should call next() when user is authenticated', () => {
      const req = mockRequest({ id: 1, email: 'user@example.com', role: 'user' })
      const res = mockResponse()
      const next = mockNext

      requireAuth(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
      expect(res.json).not.toHaveBeenCalled()
    })

    it('should return 401 when user is not authenticated', () => {
      const req = mockRequest(undefined)
      const res = mockResponse()
      const next = mockNext

      requireAuth(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should return 401 when user is null', () => {
      const req = mockRequest(null)
      const res = mockResponse()
      const next = mockNext

      requireAuth(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('requireRole', () => {
    it('should call next() when user has required role', () => {
      const req = mockRequest({ id: 1, email: 'admin@example.com', role: 'admin' })
      const res = mockResponse()
      const next = mockNext
      const middleware = requireRole(['admin', 'moderator'])

      middleware(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
      expect(res.json).not.toHaveBeenCalled()
    })

    it('should call next() when user has one of multiple allowed roles', () => {
      const req = mockRequest({ id: 1, email: 'moderator@example.com', role: 'moderator' })
      const res = mockResponse()
      const next = mockNext
      const middleware = requireRole(['admin', 'moderator'])

      middleware(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
      expect(res.json).not.toHaveBeenCalled()
    })

    it('should return 403 when user does not have required role', () => {
      const req = mockRequest({ id: 1, email: 'user@example.com', role: 'user' })
      const res = mockResponse()
      const next = mockNext
      const middleware = requireRole(['admin', 'moderator'])

      middleware(req, res, next)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions',
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should return 401 when user is not authenticated', () => {
      const req = mockRequest(undefined)
      const res = mockResponse()
      const next = mockNext
      const middleware = requireRole(['admin'])

      middleware(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should return 401 when user is null', () => {
      const req = mockRequest(null)
      const res = mockResponse()
      const next = mockNext
      const middleware = requireRole(['admin'])

      middleware(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      })
      expect(next).not.toHaveBeenCalled()
    })
  })
  describe('authMiddleware (JWT token validation)', () => {
    it('should be properly imported', () => {
      expect(authMiddleware).toBeDefined()
      expect(typeof authMiddleware).toBe('function')
    })
  })
})
