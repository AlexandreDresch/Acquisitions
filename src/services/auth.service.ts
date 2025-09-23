import { jwtToken } from '../utils/jwt.js'

import { AuthRepository } from '../repositories/auth.repository.js'
import logger from '../config/logger.js'
import { signUpSchema } from '../schemas/auth.validation.js'
import { formatValidationError } from '../utils/format.js'

export const AuthService = {
  async signUp(username: string, email: string, password: string, role = 'user') {
    if (!username || !email || !password) {
      logger.error('All fields are required for sign up')
      throw new Error('All fields are required!')
    }

    const existingUser = await AuthRepository.findUserByEmail(email)

    if (existingUser.length > 0) {
      logger.error('User already exists with email: %s', email)
      throw new Error('User already exists!')
    }

    const validationResult = signUpSchema.safeParse({ name: username, email, password, role })
    if (!validationResult.success) {
      const errorMessages = formatValidationError(validationResult.error)

      logger.error('Validation errors: %o', errorMessages)
      throw new Error(`Validation errors: ${JSON.stringify(errorMessages)}`)
    }

    const newUser = await AuthRepository.createUser(username, email, password, role)

    const token = jwtToken.sign({ id: newUser.id, email: newUser.email, role: newUser.role })

    return { user: newUser, token }
  },

  async findUserByEmail(email: string) {
    return await AuthRepository.findUserByEmail(email)
  },
}
