/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express'
import { UsersController } from '../../src/controllers/users.controller.ts'
import { UsersService } from '../../src/services/users.service.ts'

import { jest } from '@jest/globals'

jest.mock('../../src/services/users.service.ts')

const mockedUsersService = jest.mocked(UsersService)

describe('UsersController Integration Tests', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: jest.MockedFunction<NextFunction>

  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  }

  const mockUsers = [
    mockUser,
    {
      id: 2,
      name: 'Another User',
      email: 'another@example.com',
      role: 'admin',
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-02'),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    req = {
      params: {},
      body: {},
    }

    res = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn() as any,
    }

    next = jest.fn() as unknown as jest.MockedFunction<NextFunction>
  })

  describe('getAllUsers', () => {
    it('should retrieve all users successfully', async () => {
      mockedUsersService.getAllUsers.mockResolvedValue(mockUsers)

      await UsersController.getAllUsers(req as Request, res as Response, next)

      expect(mockedUsersService.getAllUsers).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Users retrieved successfully!',
        data: mockUsers,
        count: mockUsers.length,
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should handle empty users list', async () => {
      mockedUsersService.getAllUsers.mockResolvedValue([])

      await UsersController.getAllUsers(req as Request, res as Response, next)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Users retrieved successfully!',
        data: [],
        count: 0,
      })
    })

    it('should handle service errors', async () => {
      const serviceError = new Error('Database connection failed')
      mockedUsersService.getAllUsers.mockRejectedValue(serviceError)

      await UsersController.getAllUsers(req as Request, res as Response, next)

      expect(mockedUsersService.getAllUsers).toHaveBeenCalled()
      expect(next).toHaveBeenCalledWith(serviceError)
      expect(res.status).not.toHaveBeenCalled()
      expect(res.json).not.toHaveBeenCalled()
    })
  })

  describe('getUserById', () => {
    beforeEach(() => {
      req.params = { id: '1' }
    })

    it('should retrieve user by ID successfully', async () => {
      mockedUsersService.getUserById.mockResolvedValue(mockUser)

      await UsersController.getUserById(req as Request, res as Response, next)

      expect(mockedUsersService.getUserById).toHaveBeenCalledWith('1')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User retrieved successfully!',
        data: mockUser,
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should handle string ID parameters', async () => {
      req.params = { id: '123' }
      mockedUsersService.getUserById.mockResolvedValue(mockUser)

      await UsersController.getUserById(req as Request, res as Response, next)

      expect(mockedUsersService.getUserById).toHaveBeenCalledWith('123')
    })

    it('should handle user not found', async () => {
      const notFoundError = new Error('User not found')
      mockedUsersService.getUserById.mockRejectedValue(notFoundError)

      await UsersController.getUserById(req as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith(notFoundError)
    })

    it('should handle invalid ID format', async () => {
      req.params = { id: 'invalid-id' }
      const validationError = new Error('Invalid user ID')
      mockedUsersService.getUserById.mockRejectedValue(validationError)

      await UsersController.getUserById(req as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith(validationError)
    })

    it('should handle missing ID parameter', async () => {
      req.params = {}
      const validationError = new Error('User ID is required')
      mockedUsersService.getUserById.mockRejectedValue(validationError)

      await UsersController.getUserById(req as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith(validationError)
    })
  })

  describe('updateUser', () => {
    const updateData = {
      name: 'Updated User',
      email: 'updated@example.com',
      role: 'admin',
    }

    const updatedUser = {
      ...mockUser,
      ...updateData,
      updatedAt: new Date('2023-01-03'),
    }

    beforeEach(() => {
      req.params = { id: '1' }
      req.body = updateData
    })

    it('should update user successfully', async () => {
      mockedUsersService.updateUser.mockResolvedValue([updatedUser])

      await UsersController.updateUser(req as Request, res as Response, next)

      expect(mockedUsersService.updateUser).toHaveBeenCalledWith('1', updateData)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User updated successfully!',
        data: [updatedUser],
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should handle partial updates', async () => {
      const partialUpdate = { name: 'Partially Updated' }
      req.body = partialUpdate

      const partiallyUpdatedUser = {
        ...mockUser,
        ...partialUpdate,
        updatedAt: new Date('2023-01-03'),
      }
      mockedUsersService.updateUser.mockResolvedValue([partiallyUpdatedUser])

      await UsersController.updateUser(req as Request, res as Response, next)

      expect(mockedUsersService.updateUser).toHaveBeenCalledWith('1', partialUpdate)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User updated successfully!',
        data: [partiallyUpdatedUser],
      })
    })

    it('should handle update with empty body', async () => {
      req.body = {}
      const unchangedUser = { ...mockUser }
      mockedUsersService.updateUser.mockResolvedValue([unchangedUser])

      await UsersController.updateUser(req as Request, res as Response, next)

      expect(mockedUsersService.updateUser).toHaveBeenCalledWith('1', {})
    })

    it('should handle update errors', async () => {
      const updateError = new Error('Update failed: User not found')
      mockedUsersService.updateUser.mockRejectedValue(updateError)

      await UsersController.updateUser(req as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith(updateError)
    })

    it('should handle validation errors from service', async () => {
      const validationError = new Error('Invalid email format')
      mockedUsersService.updateUser.mockRejectedValue(validationError)

      await UsersController.updateUser(req as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith(validationError)
    })
  })

  describe('deleteUser', () => {
    beforeEach(() => {
      req.params = { id: '1' }
    })

    it('should delete user successfully', async () => {
      mockedUsersService.deleteUser.mockResolvedValue({
        rows: [],
        rowCount: 0,
        rowAsArray: false,
        command: 'DELETE',
        fields: [],
      } as any)

      await UsersController.deleteUser(req as Request, res as Response, next)

      expect(mockedUsersService.deleteUser).toHaveBeenCalledWith('1')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User deleted successfully!',
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should handle deletion of non-existent user', async () => {
      const deletionError = new Error('User not found')
      mockedUsersService.deleteUser.mockRejectedValue(deletionError)

      await UsersController.deleteUser(req as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith(deletionError)
    })

    it('should handle deletion errors', async () => {
      const deletionError = new Error('Database constraint violation')
      mockedUsersService.deleteUser.mockRejectedValue(deletionError)

      await UsersController.deleteUser(req as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith(deletionError)
    })

    it('should handle missing ID parameter', async () => {
      req.params = {}
      const validationError = new Error('User ID is required')
      mockedUsersService.deleteUser.mockRejectedValue(validationError)

      await UsersController.deleteUser(req as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith(validationError)
    })
  })

  describe('Error handling consistency', () => {
    it('should propagate all errors to next middleware', async () => {
      const testError = new Error('Test error')

      mockedUsersService.getAllUsers.mockRejectedValue(testError)
      await UsersController.getAllUsers(req as Request, res as Response, next)
      expect(next).toHaveBeenCalledWith(testError)

      jest.mocked(next).mockClear()
      req.params = { id: '1' }
      mockedUsersService.getUserById.mockRejectedValue(testError)
      await UsersController.getUserById(req as Request, res as Response, next)
      expect(next).toHaveBeenCalledWith(testError)

      jest.mocked(next).mockClear()
      req.body = { name: 'Updated' }
      mockedUsersService.updateUser.mockRejectedValue(testError)
      await UsersController.updateUser(req as Request, res as Response, next)
      expect(next).toHaveBeenCalledWith(testError)

      jest.mocked(next).mockClear()
      mockedUsersService.deleteUser.mockRejectedValue(testError)
      await UsersController.deleteUser(req as Request, res as Response, next)
      expect(next).toHaveBeenCalledWith(testError)
    })
  })

  describe('Response format consistency', () => {
    it('should maintain consistent response format for getAllUsers', async () => {
      mockedUsersService.getAllUsers.mockResolvedValue(mockUsers)

      await UsersController.getAllUsers(req as Request, res as Response, next)

      const responseCall = (res.json as jest.Mock).mock.calls[0][0]
      expect(responseCall).toHaveProperty('success', true)
      expect(responseCall).toHaveProperty('message')
      expect(responseCall).toHaveProperty('data', mockUsers)
      expect(responseCall).toHaveProperty('count', mockUsers.length)
    })

    it('should maintain consistent response format for getUserById', async () => {
      mockedUsersService.getUserById.mockResolvedValue(mockUser)

      await UsersController.getUserById(req as Request, res as Response, next)

      const responseCall = (res.json as jest.Mock).mock.calls[0][0]
      expect(responseCall).toHaveProperty('success', true)
      expect(responseCall).toHaveProperty('message')
      expect(responseCall).toHaveProperty('data', mockUser)
      expect(responseCall).not.toHaveProperty('count')
    })

    it('should maintain consistent response format for updateUser', async () => {
      const updatedUser = { ...mockUser, name: 'Updated' }
      mockedUsersService.updateUser.mockResolvedValue([updatedUser])

      await UsersController.updateUser(req as Request, res as Response, next)

      const responseCall = (res.json as jest.Mock).mock.calls[0][0]
      expect(responseCall).toHaveProperty('success', true)
      expect(responseCall).toHaveProperty('message')
      expect(responseCall).toHaveProperty('data', [updatedUser])
      expect(responseCall).not.toHaveProperty('count')
    })

    it('should maintain consistent response format for deleteUser', async () => {
      mockedUsersService.deleteUser.mockResolvedValue({
        rows: [],
        rowCount: 0,
        rowAsArray: false,
        command: 'DELETE',
        fields: [],
      } as any)

      await UsersController.deleteUser(req as Request, res as Response, next)

      const responseCall = (res.json as jest.Mock).mock.calls[0][0]
      expect(responseCall).toHaveProperty('success', true)
      expect(responseCall).toHaveProperty('message')
      expect(responseCall).not.toHaveProperty('data')
      expect(responseCall).not.toHaveProperty('count')
    })
  })
})
