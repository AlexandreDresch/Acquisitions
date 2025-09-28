/* eslint-disable @typescript-eslint/no-explicit-any */
import { UsersRepository } from '../../../src/repositories/users.repository.ts'
import { db } from '../../../src/config/database.ts'
import { users } from '../../../src/models/user.model.ts'
import { eq } from 'drizzle-orm'

jest.mock('../../../src/config/database', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  },
}))

describe('UsersRepository', () => {
  const mockedDb = db as any

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('should call db.select and return users', async () => {
      const fakeUsers = [{ id: 1, name: 'Alice' }]
      mockedDb.from.mockResolvedValueOnce(fakeUsers)

      const result = await UsersRepository.findAll()

      expect(mockedDb.select).toHaveBeenCalled()
      expect(mockedDb.from).toHaveBeenCalledWith(users)
      expect(result).toEqual(fakeUsers)
    })
  })

  describe('findById', () => {
    it('should return a user if found', async () => {
      const fakeUser = { id: 1, name: 'Bob' }
      mockedDb.limit.mockResolvedValueOnce([fakeUser])

      const result = await UsersRepository.findById('1')

      expect(mockedDb.where).toHaveBeenCalledWith(eq(users.id, 1))
      expect(result).toEqual(fakeUser)
    })

    it('should return null if no user found', async () => {
      mockedDb.limit.mockResolvedValueOnce([])

      const result = await UsersRepository.findById('99')

      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('should update user and return updated data', async () => {
      const updates = { name: 'Charlie' }
      const updatedUser = { id: 1, name: 'Charlie' }
      mockedDb.returning.mockResolvedValueOnce([updatedUser])

      const result = await UsersRepository.update('1', updates)

      expect(mockedDb.update).toHaveBeenCalledWith(users)
      expect(mockedDb.set).toHaveBeenCalledWith(updates)
      expect(mockedDb.where).toHaveBeenCalledWith(eq(users.id, 1))
      expect(result).toEqual([updatedUser])
    })
  })

  describe('delete', () => {
    it('should call delete with correct condition', async () => {
      mockedDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValueOnce({ rowCount: 1 }),
      })

      const result = await UsersRepository.delete('1')

      expect(mockedDb.delete).toHaveBeenCalledWith(users)
      expect(result).toEqual({ rowCount: 1 })
    })
  })
})
