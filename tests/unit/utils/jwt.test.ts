import jwt from 'jsonwebtoken'
import { jwtToken, EXPIRES_IN } from '../../../src/utils/jwt.ts'
import logger from '../../../src/config/logger.ts'

jest.mock('jsonwebtoken')
const mockedJwt = jwt as jest.Mocked<typeof jwt>

jest.mock('../../../src/config/logger.ts', () => ({
  error: jest.fn(),
}))

describe('jwtToken utility', () => {
  const payload = { userId: '123' }
  const fakeToken = 'fake.jwt.token'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('sign()', () => {
    it('should sign a payload and return a token', () => {
      mockedJwt.sign.mockReturnValue(fakeToken as unknown as never)

      const token = jwtToken.sign(payload)

      expect(token).toBe(fakeToken)
      expect(mockedJwt.sign).toHaveBeenCalledWith(payload, expect.any(String), {
        expiresIn: EXPIRES_IN,
      })
    })

    it('should log error and throw if signing fails', () => {
      mockedJwt.sign.mockImplementation(() => {
        throw new Error('sign error')
      })

      expect(() => jwtToken.sign(payload)).toThrow('Error signing JWT token')
      expect(logger.error).toHaveBeenCalledWith('Error signing JWT token:', expect.any(Error))
    })
  })

  describe('verify()', () => {
    it('should verify a valid token and return the payload', () => {
      mockedJwt.verify.mockReturnValue(payload as unknown as never)

      const result = jwtToken.verify(fakeToken)

      expect(result).toBe(payload)
      expect(mockedJwt.verify).toHaveBeenCalledWith(fakeToken, expect.any(String))
    })

    it('should log error and throw if verification fails', () => {
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('verify error')
      })

      expect(() => jwtToken.verify(fakeToken)).toThrow('Invalid or expired JWT token')
      expect(logger.error).toHaveBeenCalledWith('Error verifying JWT token:', expect.any(Error))
    })
  })
})
