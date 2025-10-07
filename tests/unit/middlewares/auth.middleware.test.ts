/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express'
import authMiddleware from '../../../src/middlewares/auth.middleware'
import { jwtToken } from '../../../src/utils/jwt'
import logger from '../../../src/config/logger'

jest.mock('../../../src/utils/jwt')
jest.mock('../../../src/config/logger')

const mockedJwtToken = jwtToken as jest.Mocked<typeof jwtToken>
const mockedLogger = logger as jest.Mocked<typeof logger>

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    jest.clearAllMocks()

    mockRequest = {
      cookies: {},
    }

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }

    mockNext = jest.fn()
  })

  describe('when no token is present', () => {
    it('should call next() without setting user when no token in cookies', async () => {
      mockRequest.cookies = {}

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRequest.user).toBeUndefined()
      expect(mockedJwtToken.verify).not.toHaveBeenCalled()
    })

    it('should call next() without setting user when token is empty string', async () => {
      mockRequest.cookies = { token: '' }

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRequest.user).toBeUndefined()
      expect(mockedJwtToken.verify).not.toHaveBeenCalled()
    })

    it('should call next() without setting user when token is null', async () => {
      mockRequest.cookies = { token: null as any }

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRequest.user).toBeUndefined()
      expect(mockedJwtToken.verify).not.toHaveBeenCalled()
    })
  })

  describe('when valid token is present', () => {
    it('should set user on request and call next() with valid token', async () => {
      const mockDecodedUser = {
        id: 1,
        email: 'user@example.com',
        role: 'user',
      }
      mockRequest.cookies = { token: 'valid.jwt.token' }
      mockedJwtToken.verify.mockReturnValue(mockDecodedUser)

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockedJwtToken.verify).toHaveBeenCalledWith('valid.jwt.token')
      expect(mockRequest.user).toEqual(mockDecodedUser)
      expect(mockNext).toHaveBeenCalled()
      expect(mockedLogger.debug).not.toHaveBeenCalled()
    })

    it('should set user with admin role when token has admin role', async () => {
      const mockDecodedUser = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin',
      }
      mockRequest.cookies = { token: 'admin.jwt.token' }
      mockedJwtToken.verify.mockReturnValue(mockDecodedUser)

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockRequest.user).toEqual(mockDecodedUser)
      expect(mockNext).toHaveBeenCalled()
    })

    it('should overwrite existing user on request', async () => {
      const existingUser = { id: 999, email: 'old@example.com', role: 'user' }
      const newUser = { id: 1, email: 'new@example.com', role: 'admin' }
      mockRequest.cookies = { token: 'new.jwt.token' }
      mockRequest.user = existingUser
      mockedJwtToken.verify.mockReturnValue(newUser)

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockRequest.user).toEqual(newUser)
      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle token with numeric id', async () => {
      const mockDecodedUser = {
        id: 12345,
        email: 'user@example.com',
        role: 'user',
      }
      mockRequest.cookies = { token: 'numeric.id.token' }
      mockedJwtToken.verify.mockReturnValue(mockDecodedUser)

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockRequest.user).toEqual(mockDecodedUser)
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('when token is invalid', () => {
    it('should log error and call next() without setting user when token verification fails', async () => {
      mockRequest.cookies = { token: 'invalid.jwt.token' }
      const verificationError = new Error('Invalid token')
      mockedJwtToken.verify.mockImplementation(() => {
        throw verificationError
      })

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockedJwtToken.verify).toHaveBeenCalledWith('invalid.jwt.token')
      expect(mockRequest.user).toBeUndefined()
      expect(mockedLogger.debug).toHaveBeenCalledWith('Invalid token in auth middleware', {
        error: verificationError,
      })
      expect(mockNext).toHaveBeenCalled()
    })

    it('should log error and call next() when token is expired', async () => {
      mockRequest.cookies = { token: 'expired.jwt.token' }
      const expiredError = new Error('Token expired')
      mockedJwtToken.verify.mockImplementation(() => {
        throw expiredError
      })

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockedLogger.debug).toHaveBeenCalledWith('Invalid token in auth middleware', {
        error: expiredError,
      })
      expect(mockNext).toHaveBeenCalled()
      expect(mockRequest.user).toBeUndefined()
    })

    it('should log error and call next() when token is malformed', async () => {
      mockRequest.cookies = { token: 'malformed.jwt.token' }
      const malformedError = new Error('Malformed token')
      mockedJwtToken.verify.mockImplementation(() => {
        throw malformedError
      })

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockedLogger.debug).toHaveBeenCalledWith('Invalid token in auth middleware', {
        error: malformedError,
      })
      expect(mockNext).toHaveBeenCalled()
      expect(mockRequest.user).toBeUndefined()
    })

    it('should not modify request user when token verification throws error', async () => {
      const existingUser = { id: 999, email: 'existing@example.com', role: 'user' }
      mockRequest.cookies = { token: 'invalid.token' }
      mockRequest.user = existingUser
      mockedJwtToken.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockRequest.user).toEqual(existingUser)
      expect(mockedLogger.debug).toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle token with extra properties in decoded payload', async () => {
      const mockDecodedUser = {
        id: 1,
        email: 'user@example.com',
        role: 'user',
        extraProp: 'should be ignored',
        anotherProp: 123,
      }
      mockRequest.cookies = { token: 'extra.props.token' }
      mockedJwtToken.verify.mockReturnValue(mockDecodedUser as any)

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockRequest.user).toEqual({
        id: 1,
        email: 'user@example.com',
        role: 'user',
      })
      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle different cookie names if multiple cookies exist', async () => {
      const mockDecodedUser = {
        id: 1,
        email: 'user@example.com',
        role: 'user',
      }
      mockRequest.cookies = {
        token: 'valid.jwt.token',
        otherCookie: 'some-value',
        session: 'session-id',
      }
      mockedJwtToken.verify.mockReturnValue(mockDecodedUser)

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockedJwtToken.verify).toHaveBeenCalledWith('valid.jwt.token')
      expect(mockRequest.user).toEqual(mockDecodedUser)
      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle cookies object being undefined', async () => {
      mockRequest.cookies = undefined as any

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRequest.user).toBeUndefined()
      expect(mockedJwtToken.verify).not.toHaveBeenCalled()
    })
  })

  describe('integration behavior', () => {
    it('should work with subsequent middleware when user is set', async () => {
      const mockDecodedUser = {
        id: 1,
        email: 'user@example.com',
        role: 'user',
      }
      mockRequest.cookies = { token: 'valid.token' }
      mockedJwtToken.verify.mockReturnValue(mockDecodedUser)

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockRequest.user).toBeDefined()
      expect(mockRequest.user?.id).toBe(1)
      expect(mockRequest.user?.email).toBe('user@example.com')
      expect(mockRequest.user?.role).toBe('user')
      expect(mockNext).toHaveBeenCalled()
    })

    it('should work with subsequent middleware when no token is present', async () => {
      mockRequest.cookies = {}

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockRequest.user).toBeUndefined()
      expect(mockNext).toHaveBeenCalled()
    })

    it('should not interfere with other request properties', async () => {
      mockRequest.cookies = { token: 'valid.token' }
      mockRequest.headers = { 'user-agent': 'test-agent' }
      mockRequest.method = 'GET'
      mockRequest.url = '/test'

      const mockDecodedUser = {
        id: 1,
        email: 'user@example.com',
        role: 'user',
      }
      mockedJwtToken.verify.mockReturnValue(mockDecodedUser)

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockRequest.user).toEqual(mockDecodedUser)
      expect(mockRequest.headers).toEqual({ 'user-agent': 'test-agent' })
      expect(mockRequest.method).toBe('GET')
      expect(mockRequest.url).toBe('/test')
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockRequest.cookies = { token: 'valid.token' }
      const unexpectedError = new Error('Unexpected error')
      mockedJwtToken.verify.mockImplementation(() => {
        throw unexpectedError
      })

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockedLogger.debug).toHaveBeenCalledWith('Invalid token in auth middleware', {
        error: unexpectedError,
      })
      expect(mockNext).toHaveBeenCalled()
    })

    it('should continue execution even when logger fails', async () => {
      mockRequest.cookies = { token: 'valid.token' }
      const tokenError = new Error('Token error')
      mockedJwtToken.verify.mockImplementation(() => {
        throw tokenError
      })
      mockedLogger.debug.mockImplementation(() => {
        throw new Error('Logger failed')
      })

      await expect(
        authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)
      ).resolves.not.toThrow()

      expect(mockNext).toHaveBeenCalled()
    })
  })
})
