/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from 'bcryptjs'
import { db } from '../../../src/config/database.ts'
import { users } from '../../../src/models/user.model.ts'
import { eq } from 'drizzle-orm'
import { AuthRepository } from '../../../src/repositories/auth.repository.ts'

import { jest } from '@jest/globals'

jest.mock('../../../src/config/database.ts', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}))

jest.mock('../../../src/models/user.model.ts', () => ({
  users: {
    id: 'id',
    name: 'name',
    email: 'email',
    passwordHash: 'passwordHash',
    role: 'role',
    created_at: 'created_at',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
}))

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}))

const mockedDb = jest.mocked(db)
const mockedEq = jest.mocked(eq)
const mockedBcrypt = jest.mocked(bcrypt)

describe('AuthRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('findUserByEmail', () => {
    it('should find a user by email', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'user',
        created_at: new Date(),
      }

      const mockFrom = jest.fn().mockReturnThis()
      const mockWhere = jest.fn().mockReturnThis()
      const mockLimit = jest.fn().mockResolvedValue([mockUser] as unknown as never)

      mockedDb.select.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        where: mockWhere,
      } as any)

      mockWhere.mockReturnValue({
        limit: mockLimit,
      } as any)

      mockedEq.mockReturnValue('email_condition' as any)

      const result = await AuthRepository.findUserByEmail('test@example.com')

      expect(mockedDb.select).toHaveBeenCalled()
      expect(mockFrom).toHaveBeenCalledWith(users)
      expect(mockedEq).toHaveBeenCalledWith(users.email, 'test@example.com')
      expect(mockWhere).toHaveBeenCalledWith('email_condition')
      expect(mockLimit).toHaveBeenCalledWith(1)
      expect(result).toEqual([mockUser])
    })

    it('should return empty array when no user found', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockWhere = jest.fn().mockReturnThis()
      const mockLimit = jest.fn().mockResolvedValue([] as unknown as never)

      mockedDb.select.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        where: mockWhere,
      } as any)

      mockWhere.mockReturnValue({
        limit: mockLimit,
      } as any)

      mockedEq.mockReturnValue('email_condition' as any)

      const result = await AuthRepository.findUserByEmail('nonexistent@example.com')

      expect(result).toEqual([])
    })

    it('should handle database errors', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockWhere = jest.fn().mockReturnThis()
      const mockLimit = jest.fn().mockRejectedValue(new Error('Database error') as unknown as never)

      mockedDb.select.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        where: mockWhere,
      } as any)

      mockWhere.mockReturnValue({
        limit: mockLimit,
      } as any)

      await expect(AuthRepository.findUserByEmail('test@example.com')).rejects.toThrow(
        'Database error'
      )
    })
  })

  describe('createUser', () => {
    const userData = {
      username: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user' as const,
    }

    const expectedUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      createdAt: new Date(),
    }

    beforeEach(() => {
      mockedBcrypt.genSalt.mockResolvedValue('salt123' as never)
      mockedBcrypt.hash.mockResolvedValue('hashedpassword123' as never)
    })

    it('should create a new user successfully', async () => {
      const mockValues = jest.fn().mockReturnThis()
      const mockReturning = jest.fn().mockResolvedValue([expectedUser] as unknown as never)

      mockedDb.insert.mockReturnValue({
        values: mockValues,
      } as any)

      mockValues.mockReturnValue({
        returning: mockReturning,
      } as any)

      const result = await AuthRepository.createUser(
        userData.username,
        userData.email,
        userData.password,
        userData.role
      )

      expect(mockedBcrypt.genSalt).toHaveBeenCalledWith(10)
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 'salt123')
      expect(mockedDb.insert).toHaveBeenCalledWith(users)
      expect(mockValues).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: 'user',
      })
      expect(mockReturning).toHaveBeenCalledWith({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.created_at,
      })
      expect(result).toEqual(expectedUser)
    })

    it('should create user with default role when not provided', async () => {
      const mockValues = jest.fn().mockReturnThis()
      const mockReturning = jest.fn().mockResolvedValue([expectedUser] as unknown as never)

      mockedDb.insert.mockReturnValue({
        values: mockValues,
      } as any)

      mockValues.mockReturnValue({
        returning: mockReturning,
      } as any)

      const result = await AuthRepository.createUser(
        userData.username,
        userData.email,
        userData.password
      )

      expect(mockValues).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: 'user',
      })
      expect(result).toEqual(expectedUser)
    })

    it('should throw error when user creation fails', async () => {
      const mockValues = jest.fn().mockReturnThis()
      const mockReturning = jest.fn().mockResolvedValue([] as unknown as never)

      mockedDb.insert.mockReturnValue({
        values: mockValues,
      } as any)

      mockValues.mockReturnValue({
        returning: mockReturning,
      } as any)

      await expect(
        AuthRepository.createUser(
          userData.username,
          userData.email,
          userData.password,
          userData.role
        )
      ).rejects.toThrow('User creation failed')
    })

    it('should handle bcrypt errors', async () => {
      mockedBcrypt.genSalt.mockRejectedValue(new Error('Bcrypt error') as unknown as never)

      await expect(
        AuthRepository.createUser(userData.username, userData.email, userData.password)
      ).rejects.toThrow('Bcrypt error')
    })

    it('should handle database insertion errors', async () => {
      mockedBcrypt.genSalt.mockResolvedValue('salt123' as never)
      mockedBcrypt.hash.mockResolvedValue('hashedpassword123' as never)

      const mockValues = jest.fn().mockReturnThis()
      const mockReturning = jest
        .fn()
        .mockRejectedValue(new Error('Insert failed') as unknown as never)

      mockedDb.insert.mockReturnValue({
        values: mockValues,
      } as any)

      mockValues.mockReturnValue({
        returning: mockReturning,
      } as any)

      await expect(
        AuthRepository.createUser(userData.username, userData.email, userData.password)
      ).rejects.toThrow('Insert failed')
    })
  })

  describe('verifyPassword', () => {
    it('should return true for matching passwords', async () => {
      mockedBcrypt.compare.mockResolvedValue(true as never)

      const result = await AuthRepository.verifyPassword('password123', 'hashedpassword123')

      expect(mockedBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword123')
      expect(result).toBe(true)
    })

    it('should return false for non-matching passwords', async () => {
      mockedBcrypt.compare.mockResolvedValue(false as never)

      const result = await AuthRepository.verifyPassword('wrongpassword', 'hashedpassword123')

      expect(mockedBcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword123')
      expect(result).toBe(false)
    })

    it('should handle bcrypt comparison errors', async () => {
      mockedBcrypt.compare.mockRejectedValue(new Error('Comparison error') as unknown as never)

      await expect(
        AuthRepository.verifyPassword('password123', 'hashedpassword123')
      ).rejects.toThrow('Comparison error')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty email in findUserByEmail', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockWhere = jest.fn().mockReturnThis()
      const mockLimit = jest.fn().mockResolvedValue([] as unknown as never)

      mockedDb.select.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        where: mockWhere,
      } as any)

      mockWhere.mockReturnValue({
        limit: mockLimit,
      } as any)

      mockedEq.mockReturnValue('email_condition' as any)

      await AuthRepository.findUserByEmail('')

      expect(mockedEq).toHaveBeenCalledWith(users.email, '')
    })

    it('should handle special characters in password', async () => {
      const specialPassword = 'p@ssw0rd!@#$%^&*()'
      mockedBcrypt.genSalt.mockResolvedValue('salt123' as never)
      mockedBcrypt.hash.mockResolvedValue('hashedspecialpassword' as never)

      const mockValues = jest.fn().mockReturnThis()
      const mockReturning = jest.fn().mockResolvedValue([
        {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
          createdAt: new Date(),
        },
      ] as unknown as never)

      mockedDb.insert.mockReturnValue({
        values: mockValues,
      } as any)

      mockValues.mockReturnValue({
        returning: mockReturning,
      } as any)

      await AuthRepository.createUser('Test User', 'test@example.com', specialPassword)

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(specialPassword, 'salt123')
    })

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000)
      mockedBcrypt.genSalt.mockResolvedValue('salt123' as never)
      mockedBcrypt.hash.mockResolvedValue('hashedlongpassword' as never)

      const mockValues = jest.fn().mockReturnThis()
      const mockReturning = jest.fn().mockResolvedValue([
        {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
          createdAt: new Date(),
        },
      ] as unknown as never)

      mockedDb.insert.mockReturnValue({
        values: mockValues,
      } as any)

      mockValues.mockReturnValue({
        returning: mockReturning,
      } as any)

      await AuthRepository.createUser('Test User', 'test@example.com', longPassword)

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(longPassword, 'salt123')
    })
  })
})
