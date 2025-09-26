import { jwtToken } from '../utils/jwt.ts'

import { AuthRepository } from '../repositories/auth.repository.ts'
import logger from '../config/logger.ts'
import { signUpSchema } from '../schemas/auth.validation.ts'
import { formatValidationError } from '../utils/format.ts'

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

  async signIn(email: string, password: string) {
    if (!email || !password) {
      logger.error('Email and password are required for sign in')
      throw new Error('Email and password are required!')
    }

    const user = await AuthRepository.findUserByEmail(email)

    if (user.length === 0) {
      logger.error('No user found with email: %s', email)
      throw new Error('Invalid email or password!')
    }

    const isPasswordValid = await AuthRepository.verifyPassword(password, user[0].passwordHash)

    if (!isPasswordValid) {
      logger.error('Invalid password for email: %s', email)
      throw new Error('Invalid email or password!')
    }

    const token = jwtToken.sign({ id: user[0].id, email: user[0].email, role: user[0].role })

    return { user: user[0], token }
  },

  async findUserByEmail(email: string) {
    return await AuthRepository.findUserByEmail(email)
  },
}
