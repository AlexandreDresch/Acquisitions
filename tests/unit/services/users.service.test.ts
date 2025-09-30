import { UsersService } from '../../../src/services/users.service.ts'
import { UsersRepository } from '../../../src/repositories/users.repository.ts'

jest.mock('../../../src/repositories/users.repository.ts', () => ({
  UsersRepository: {
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}))

jest.mock('../../../src/config/logger.ts', () => ({
  error: jest.fn(),
}))

describe('UsersService', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllUsers', () => {
    it('should return users from repository', async () => {
      const fakeUsers = [{ id: 1, name: 'Alice' }]
      ;(UsersRepository.findAll as jest.Mock).mockResolvedValueOnce(fakeUsers)

      const result = await UsersService.getAllUsers()

      expect(UsersRepository.findAll).toHaveBeenCalled()
      expect(result).toEqual(fakeUsers)
    })

    it('should log and throw error on failure', async () => {
      ;(UsersRepository.findAll as jest.Mock).mockRejectedValueOnce(new Error('DB error'))

      await expect(UsersService.getAllUsers()).rejects.toThrow('Error fetching users')
    })
  })

  describe('getUserById', () => {
    it('should return a user from repository', async () => {
      const fakeUser = { id: 1, name: 'Bob' }
      ;(UsersRepository.findById as jest.Mock).mockResolvedValueOnce(fakeUser)

      const result = await UsersService.getUserById('1')

      expect(UsersRepository.findById).toHaveBeenCalledWith('1')
      expect(result).toEqual(fakeUser)
    })

    it('should log and throw error on failure', async () => {
      ;(UsersRepository.findById as jest.Mock).mockRejectedValueOnce(new Error('DB error'))

      await expect(UsersService.getUserById('1')).rejects.toThrow('Error fetching user')
    })
  })

  describe('updateUser', () => {
    it('should update a user and return result', async () => {
      const updates = { name: 'Charlie' }
      const updatedUser = { id: 1, name: 'Charlie' }
      ;(UsersRepository.update as jest.Mock).mockResolvedValueOnce(updatedUser)

      const result = await UsersService.updateUser('1', updates)

      expect(UsersRepository.update).toHaveBeenCalledWith('1', updates)
      expect(result).toEqual(updatedUser)
    })

    it('should log and throw error on failure', async () => {
      ;(UsersRepository.update as jest.Mock).mockRejectedValueOnce(new Error('DB error'))

      await expect(UsersService.updateUser('1', { name: 'Charlie' })).rejects.toThrow(
        'Error updating user'
      )
    })
  })

  describe('deleteUser', () => {
    it('should delete a user and return result', async () => {
      const deleteResult = { rowCount: 1 }
      ;(UsersRepository.delete as jest.Mock).mockResolvedValueOnce(deleteResult)

      const result = await UsersService.deleteUser('1')

      expect(UsersRepository.delete).toHaveBeenCalledWith('1')
      expect(result).toEqual(deleteResult)
    })

    it('should log and throw error on failure', async () => {
      ;(UsersRepository.delete as jest.Mock).mockRejectedValueOnce(new Error('DB error'))

      await expect(UsersService.deleteUser('1')).rejects.toThrow('Error deleting user')
    })
  })
})
