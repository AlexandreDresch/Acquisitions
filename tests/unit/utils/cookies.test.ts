import { cookies } from '../../../src/utils/cookies.ts'
import { Response } from 'express'

describe('cookies utility', () => {
  let res: Partial<Response>

  beforeEach(() => {
    res = {
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    }
  })

  describe('getOptions', () => {
    it('should return default cookie options', () => {
      const options = cookies.getOptions()
      expect(options).toMatchObject({
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
      })
    })

    it('should set secure = true in production', () => {
      process.env.NODE_ENV = 'production'
      const options = cookies.getOptions()
      expect(options.secure).toBe(true)
    })

    it('should set secure = false in non-production', () => {
      process.env.NODE_ENV = 'development'
      const options = cookies.getOptions()
      expect(options.secure).toBe(false)
    })
  })

  describe('set', () => {
    it('should call res.cookie with merged options', () => {
      cookies.set(res as Response, 'token', 'abc123', { maxAge: 1234 })

      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'abc123',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          maxAge: 1234,
        })
      )
    })
  })

  describe('clear', () => {
    it('should call res.clearCookie with merged options', () => {
      cookies.clear(res as Response, 'token', { path: '/' })

      expect(res.clearCookie).toHaveBeenCalledWith(
        'token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
        })
      )
    })
  })

  describe('get', () => {
    it('should return cookie value by name', () => {
      const req = { cookies: { token: 'abc123' } }
      const value = cookies.get(req, 'token')
      expect(value).toBe('abc123')
    })

    it('should return undefined if cookie not found', () => {
      const req = { cookies: {} }
      const value = cookies.get(req, 'missing')
      expect(value).toBeUndefined()
    })
  })
})
