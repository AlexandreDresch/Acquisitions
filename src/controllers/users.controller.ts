import { NextFunction, Request, Response } from 'express'
import { UsersService } from '../services/users.service.js'

export const UsersController = {
  async getAllUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UsersService.getAllUsers()
      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully!',
        data: users,
        count: users.length,
      })
    } catch (error) {
      next(error)
    }
  },

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const user = await UsersService.getUserById(id)
      res.status(200).json({
        success: true,
        message: 'User retrieved successfully!',
        data: user,
      })
    } catch (error) {
      next(error)
    }
  },

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const updates = req.body
      const updatedUser = await UsersService.updateUser(id, updates)
      res.status(200).json({
        success: true,
        message: 'User updated successfully!',
        data: updatedUser,
      })
    } catch (error) {
      next(error)
    }
  },

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await UsersService.deleteUser(id)
      res.status(200).json({
        success: true,
        message: 'User deleted successfully!',
      })
    } catch (error) {
      next(error)
    }
  },
}
