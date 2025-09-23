import jwt from 'jsonwebtoken'
import config from '../config/config.js'
import logger from '../config/logger.js'

const SECRET = config.jwt
export const EXPIRES_IN = '1d'

export const jwtToken = {
  sign: (payload: object): string => {
    try {
      return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN })
    } catch (error) {
      logger.error('Error signing JWT token:', error)
      throw new Error('Error signing JWT token')
    }
  },
  verify: (token: string): object | string => {
    try {
      return jwt.verify(token, SECRET)
    } catch (error) {
      logger.error('Error verifying JWT token:', error)
      throw new Error('Invalid or expired JWT token')
    }
  },
}
