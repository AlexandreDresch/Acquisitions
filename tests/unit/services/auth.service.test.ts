/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuthService } from '../../../src/services/auth.service.ts'
import { AuthRepository } from '../../../src/repositories/auth.repository.ts'
import { jwtToken } from '../../../src/utils/jwt.ts'
import logger from '../../../src/config/logger.ts'
import { signUpSchema } from '../../../src/schemas/auth.validation.ts'
import { formatValidationError } from '../../../src/utils/format.ts'

import { jest } from '@jest/globals'

jest.mock('../../../src/repositories/auth.repository.ts')
jest.mock('../../../src/utils/jwt.ts')
jest.mock('../../../src/config/logger.ts')
jest.mock('../../../src/schemas/auth.validation.ts')
jest.mock('../../../src/utils/format.ts')

const mockedAuthRepository = AuthRepository as jest.Mocked<typeof AuthRepository>
const mockedJwtToken = jwtToken as jest.Mocked<typeof jwtToken>
const mockedLogger = logger as jest.Mocked<typeof logger>
const mockedSignUpSchema = signUpSchema as jest.Mocked<typeof signUpSchema>
const mockedFormatValidationError = formatValidationError as jest.MockedFunction<
  typeof formatValidationError
>

describe('AuthService', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    role: 'user',
    created_at: new Date(),
    updated_at: new Date(),
  }

  const mockReturnedUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockToken = 'mock-jwt-token'

  beforeEach(() => {
    jest.clearAllMocks()
    mockedJwtToken.sign.mockReturnValue(mockToken)
  })

  describe('signUp', () => {
    const signUpData = {
      username: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user' as const,
    }

    it('should successfully sign up a new user', async () => {
      mockedAuthRepository.findUserByEmail.mockResolvedValue([])
      mockedAuthRepository.createUser.mockResolvedValue(mockReturnedUser)

      mockedSignUpSchema.safeParse.mockReturnValue({
        success: true,
        data: signUpData,
      } as any)

      const result = await AuthService.signUp(
        signUpData.username,
        signUpData.email,
        signUpData.password,
        signUpData.role
      )

      expect(mockedAuthRepository.findUserByEmail).toHaveBeenCalledWith(signUpData.email)
      expect(mockedSignUpSchema.safeParse).toHaveBeenCalledWith({
        name: signUpData.username,
        email: signUpData.email,
        password: signUpData.password,
        role: signUpData.role,
      })
      expect(mockedAuthRepository.createUser).toHaveBeenCalledWith(
        signUpData.username,
        signUpData.email,
        signUpData.password,
        signUpData.role
      )
      expect(mockedJwtToken.sign).toHaveBeenCalledWith({
        id: mockReturnedUser.id,
        email: mockReturnedUser.email,
        role: mockReturnedUser.role,
      })
      expect(result).toEqual({
        user: mockReturnedUser,
        token: mockToken,
      })
    })

    it('should throw error when required fields are missing', async () => {
      await expect(AuthService.signUp('', 'test@example.com', 'password')).rejects.toThrow(
        'Field username is required!'
      )

      await expect(AuthService.signUp('Test User', '', 'password')).rejects.toThrow(
        'Field email is required!'
      )

      await expect(AuthService.signUp('Test User', 'test@example.com', '')).rejects.toThrow(
        'Field password is required!'
      )
    })

    it('should throw error when user already exists', async () => {
      mockedAuthRepository.findUserByEmail.mockResolvedValue([mockUser])

      await expect(
        AuthService.signUp(signUpData.username, signUpData.email, signUpData.password)
      ).rejects.toThrow('User already exists!')

      expect(mockedLogger.error).toHaveBeenCalledWith(
        'User already exists with email: %s',
        signUpData.email
      )
      expect(mockedAuthRepository.createUser).not.toHaveBeenCalled()
    })

    it('should throw error when validation fails', async () => {
      const validationErrors = [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Invalid email format' },
      ]

      mockedAuthRepository.findUserByEmail.mockResolvedValue([])
      mockedSignUpSchema.safeParse.mockReturnValue({
        success: false,
        error: 'validation error',
      } as any)
      mockedFormatValidationError.mockReturnValue(validationErrors)

      await expect(
        AuthService.signUp(signUpData.username, signUpData.email, signUpData.password)
      ).rejects.toThrow(`Validation errors: ${JSON.stringify(validationErrors)}`)

      expect(mockedLogger.error).toHaveBeenCalledWith('Validation errors: %o', validationErrors)
      expect(mockedAuthRepository.createUser).not.toHaveBeenCalled()
    })

    it('should use default role when not provided', async () => {
      mockedAuthRepository.findUserByEmail.mockResolvedValue([])
      mockedAuthRepository.createUser.mockResolvedValue(mockReturnedUser)
      mockedSignUpSchema.safeParse.mockReturnValue({
        success: true,
        data: signUpData,
      } as any)

      await AuthService.signUp(signUpData.username, signUpData.email, signUpData.password)

      expect(mockedAuthRepository.createUser).toHaveBeenCalledWith(
        signUpData.username,
        signUpData.email,
        signUpData.password,
        'user'
      )
    })

    it('should handle repository errors during sign up', async () => {
      mockedAuthRepository.findUserByEmail.mockResolvedValue([])
      mockedSignUpSchema.safeParse.mockReturnValue({
        success: true,
        data: signUpData,
      } as any)
      mockedAuthRepository.createUser.mockRejectedValue(new Error('Database error'))

      await expect(
        AuthService.signUp(signUpData.username, signUpData.email, signUpData.password)
      ).rejects.toThrow('Database error')
    })
  })

  describe('signIn', () => {
    const signInData = {
      email: 'test@example.com',
      password: 'password123',
    }

    it('should successfully sign in a user', async () => {
      mockedAuthRepository.findUserByEmail.mockResolvedValue([mockUser])
      mockedAuthRepository.verifyPassword.mockResolvedValue(true)

      const result = await AuthService.signIn(signInData.email, signInData.password)

      expect(mockedAuthRepository.findUserByEmail).toHaveBeenCalledWith(signInData.email)
      expect(mockedAuthRepository.verifyPassword).toHaveBeenCalledWith(
        signInData.password,
        mockUser.passwordHash
      )
      expect(mockedJwtToken.sign).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      })
      expect(result).toEqual({
        user: mockUser,
        token: mockToken,
      })
    })

    it('should throw error when email or password is missing', async () => {
      await expect(AuthService.signIn('', 'password')).rejects.toThrow('Field email is required!')

      await expect(AuthService.signIn('test@example.com', '')).rejects.toThrow(
        'Field password is required!'
      )
    })

    it('should throw error when no user found with email', async () => {
      mockedAuthRepository.findUserByEmail.mockResolvedValue([])

      await expect(AuthService.signIn(signInData.email, signInData.password)).rejects.toThrow(
        'Invalid email or password!'
      )

      expect(mockedLogger.error).toHaveBeenCalledWith(
        'No user found with email: %s',
        signInData.email
      )
      expect(mockedAuthRepository.verifyPassword).not.toHaveBeenCalled()
    })

    it('should throw error when password is invalid', async () => {
      mockedAuthRepository.findUserByEmail.mockResolvedValue([mockUser])
      mockedAuthRepository.verifyPassword.mockResolvedValue(false)

      await expect(AuthService.signIn(signInData.email, signInData.password)).rejects.toThrow(
        'Invalid email or password!'
      )

      expect(mockedLogger.error).toHaveBeenCalledWith(
        'Invalid password for email: %s',
        signInData.email
      )
      expect(mockedJwtToken.sign).not.toHaveBeenCalled()
    })

    it('should handle repository errors during sign in', async () => {
      mockedAuthRepository.findUserByEmail.mockRejectedValue(new Error('Database error'))

      await expect(AuthService.signIn(signInData.email, signInData.password)).rejects.toThrow(
        'Database error'
      )
    })

    it('should handle password verification errors', async () => {
      mockedAuthRepository.findUserByEmail.mockResolvedValue([mockUser])
      mockedAuthRepository.verifyPassword.mockRejectedValue(new Error('Bcrypt error'))

      await expect(AuthService.signIn(signInData.email, signInData.password)).rejects.toThrow(
        'Bcrypt error'
      )
    })
  })

  describe('findUserByEmail', () => {
    it('should find user by email', async () => {
      mockedAuthRepository.findUserByEmail.mockResolvedValue([mockUser])

      const result = await AuthService.findUserByEmail('test@example.com')

      expect(mockedAuthRepository.findUserByEmail).toHaveBeenCalledWith('test@example.com')
      expect(result).toEqual([mockUser])
    })

    it('should handle repository errors', async () => {
      mockedAuthRepository.findUserByEmail.mockRejectedValue(new Error('Database error'))

      await expect(AuthService.findUserByEmail('test@example.com')).rejects.toThrow(
        'Database error'
      )
    })

    it('should return empty array when no user found', async () => {
      mockedAuthRepository.findUserByEmail.mockResolvedValue([])

      const result = await AuthService.findUserByEmail('nonexistent@example.com')

      expect(result).toEqual([])
    })
  })

  describe('Edge cases', () => {
    it('should handle whitespace in input fields for sign up', async () => {
      await expect(AuthService.signUp('  ', 'test@example.com', 'password')).rejects.toThrow(
        'Field username is required!'
      )
    })

    it('should handle whitespace in input fields for sign in', async () => {
      await expect(AuthService.signIn('  ', 'password')).rejects.toThrow('Field email is required!')
    })

    it('should handle special characters in email', async () => {
      const specialEmail = 'test+special@example.com'
      mockedAuthRepository.findUserByEmail.mockResolvedValue([])
      mockedAuthRepository.createUser.mockResolvedValue(mockReturnedUser)
      mockedSignUpSchema.safeParse.mockReturnValue({
        success: true,
        data: { name: 'Test User', email: specialEmail, password: 'password', role: 'user' },
      } as any)

      await AuthService.signUp('Test User', specialEmail, 'password')

      expect(mockedAuthRepository.findUserByEmail).toHaveBeenCalledWith(specialEmail)
    })

    it('should handle different user roles', async () => {
      const adminUser = { ...mockReturnedUser, role: 'admin' as const }

      mockedAuthRepository.findUserByEmail.mockResolvedValue([])
      mockedAuthRepository.createUser.mockResolvedValue(adminUser)
      mockedSignUpSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'password',
          role: 'admin',
        },
      } as any)

      const result = await AuthService.signUp(
        'Admin User',
        'admin@example.com',
        'password',
        'admin'
      )

      expect(mockedJwtToken.sign).toHaveBeenCalledWith({
        id: adminUser.id,
        email: adminUser.email,
        role: 'admin',
      })
      expect(result.user.role).toBe('admin')
    })
  })
})
