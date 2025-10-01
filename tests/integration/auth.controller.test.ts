/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express'
import { AuthController } from '../../src/controllers/auth.controller.ts'
import { AuthService } from '../../src/services/auth.service.ts'
import { cookies } from '../../src/utils/cookies.ts'

import { jest } from '@jest/globals'

jest.mock('../../src/services/auth.service.ts')
jest.mock('../../src/utils/cookies.ts')

const mockedAuthService = AuthService as jest.Mocked<typeof AuthService>
const mockedCookies = cookies as jest.Mocked<typeof cookies>

describe('AuthController Integration Tests', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  const mockSignUpResult = {
    user: {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      createdAt: new Date('2023-01-01'),
    },
    token: 'mock-jwt-token',
  }

  const mockSignInResult = {
    user: {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: 'hashedpassword123',
      role: 'user',
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01'),
    },
    token: 'mock-jwt-token',
  }

  beforeEach(() => {
    jest.clearAllMocks()

    req = {
      body: {},
    }

    res = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn() as any,
    }

    next = jest.fn()
  })

  describe('signUp', () => {
    const signUpData = {
      username: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
    }

    beforeEach(() => {
      req.body = signUpData
    })

    it('should successfully register a new user and set cookie', async () => {
      mockedAuthService.signUp.mockResolvedValue(mockSignUpResult)

      await AuthController.signUp(req as Request, res as Response, next)

      expect(mockedAuthService.signUp).toHaveBeenCalledWith(
        signUpData.username,
        signUpData.email,
        signUpData.password,
        signUpData.role
      )
      expect(mockedCookies.set).toHaveBeenCalledWith(res, 'token', mockSignUpResult.token)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User created successfully!',
        data: mockSignUpResult,
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should handle missing role in request body', async () => {
      req.body = {
        username: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }

      mockedAuthService.signUp.mockResolvedValue(mockSignUpResult)

      await AuthController.signUp(req as Request, res as Response, next)

      expect(mockedAuthService.signUp).toHaveBeenCalledWith(
        'Test User',
        'test@example.com',
        'password123',
        undefined
      )
    })

    it('should handle AuthService errors', async () => {
      const serviceError = new Error('User already exists')
      mockedAuthService.signUp.mockRejectedValue(serviceError)

      await AuthController.signUp(req as Request, res as Response, next)

      expect(mockedAuthService.signUp).toHaveBeenCalled()
      expect(mockedCookies.set).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalledWith(serviceError)
      expect(res.status).not.toHaveBeenCalled()
      expect(res.json).not.toHaveBeenCalled()
    })
  })

  describe('signIn', () => {
    const signInData = {
      email: 'test@example.com',
      password: 'password123',
    }

    beforeEach(() => {
      req.body = signInData
    })

    it('should successfully sign in user and set cookie', async () => {
      mockedAuthService.signIn.mockResolvedValue(mockSignInResult)

      await AuthController.signIn(req as Request, res as Response, next)

      expect(mockedAuthService.signIn).toHaveBeenCalledWith(signInData.email, signInData.password)
      expect(mockedCookies.set).toHaveBeenCalledWith(res, 'token', mockSignInResult.token)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User signed in successfully!',
        data: mockSignInResult,
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should handle AuthService authentication errors', async () => {
      const authError = new Error('Invalid email or password')
      mockedAuthService.signIn.mockRejectedValue(authError)

      await AuthController.signIn(req as Request, res as Response, next)

      expect(mockedAuthService.signIn).toHaveBeenCalled()
      expect(mockedCookies.set).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalledWith(authError)
    })

    it('should handle missing credentials', async () => {
      req.body = {}

      const validationError = new Error('Email and password are required!')
      mockedAuthService.signIn.mockRejectedValue(validationError)

      await AuthController.signIn(req as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith(validationError)
    })

    it('should handle invalid password', async () => {
      const authError = new Error('Invalid email or password!')
      mockedAuthService.signIn.mockRejectedValue(authError)

      await AuthController.signIn(req as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith(authError)
    })
  })

  describe('signOut', () => {
    it('should successfully sign out user and clear cookie', async () => {
      await AuthController.signOut({} as Request, res as Response, next)

      expect(mockedCookies.clear).toHaveBeenCalledWith(res, 'token')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User signed out successfully!',
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should handle cookie clearing errors', async () => {
      mockedCookies.clear.mockImplementation(() => {
        throw new Error('Cookie clear error')
      })

      await AuthController.signOut({} as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('Response data verification', () => {
    it('should include correct user fields for signUp response', async () => {
      req.body = {
        username: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }

      mockedAuthService.signUp.mockResolvedValue(mockSignUpResult)

      await AuthController.signUp(req as Request, res as Response, next)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User created successfully!',
        data: {
          user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            role: 'user',
            createdAt: expect.any(Date),
          },
          token: 'mock-jwt-token',
        },
      })
    })

    it('should include correct user fields for signIn response', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
      }

      mockedAuthService.signIn.mockResolvedValue(mockSignInResult)

      await AuthController.signIn(req as Request, res as Response, next)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User signed in successfully!',
        data: {
          user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            passwordHash: 'hashedpassword123',
            role: 'user',
            created_at: expect.any(Date),
            updated_at: expect.any(Date),
          },
          token: 'mock-jwt-token',
        },
      })
    })
  })
})
