import logger from '../config/logger.ts'
import { users } from '../models/user.model.ts'
import { UsersRepository } from '../repositories/users.repository.ts'

export type UserUpdate = Partial<typeof users.$inferInsert>

export const UsersService = {
  async getAllUsers() {
    try {
      return UsersRepository.findAll()
    } catch (error) {
      logger.error('Error fetching users:', error)
      throw new Error('Error fetching users')
    }
  },

  async getUserById(id: string) {
    try {
      return UsersRepository.findById(id)
    } catch (error) {
      logger.error(`Error fetching user with ID ${id}:`, error)
      throw new Error('Error fetching user')
    }
  },

  async updateUser(id: string, updates: UserUpdate) {
    try {
      return UsersRepository.update(id, updates)
    } catch (error) {
      logger.error(`Error updating user with ID ${id}:`, error)
      throw new Error('Error updating user')
    }
  },

  async deleteUser(id: string) {
    try {
      return UsersRepository.delete(id)
    } catch (error) {
      logger.error(`Error deleting user with ID ${id}:`, error)
      throw new Error('Error deleting user')
    }
  },
}
