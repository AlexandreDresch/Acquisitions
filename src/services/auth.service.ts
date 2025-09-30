import { jwtToken } from '../utils/jwt.ts'

import { AuthRepository } from '../repositories/auth.repository.ts'
import logger from '../config/logger.ts'
import { signUpSchema } from '../schemas/auth.validation.ts'
import { formatValidationError } from '../utils/format.ts'
import { validateRequiredFields } from '../utils/utils.ts'

export const AuthService = {
  async signUp(username: string, email: string, password: string, role = 'user') {
    const {
      username: trimmedUsername,
      email: trimmedEmail,
      password: trimmedPassword,
    } = validateRequiredFields({ username, email, password })

    const existingUser = await AuthRepository.findUserByEmail(trimmedEmail)

    if (existingUser.length > 0) {
      logger.error('User already exists with email: %s', trimmedEmail)
      throw new Error('User already exists!')
    }

    const validationResult = signUpSchema.safeParse({
      name: trimmedUsername,
      email: trimmedEmail,
      password: trimmedPassword,
      role,
    })
    if (!validationResult.success) {
      const errorMessages = formatValidationError(validationResult.error)

      logger.error('Validation errors: %o', errorMessages)
      throw new Error(`Validation errors: ${JSON.stringify(errorMessages)}`)
    }

    const newUser = await AuthRepository.createUser(
      trimmedUsername,
      trimmedEmail,
      trimmedPassword,
      role
    )

    const token = jwtToken.sign({ id: newUser.id, email: newUser.email, role: newUser.role })

    return { user: newUser, token }
  },

  async signIn(email: string, password: string) {
    const { email: trimmedEmail, password: trimmedPassword } = validateRequiredFields({
      email,
      password,
    })

    const user = await AuthRepository.findUserByEmail(trimmedEmail)

    if (user.length === 0) {
      logger.error('No user found with email: %s', trimmedEmail)
      throw new Error('Invalid email or password!')
    }

    const isPasswordValid = await AuthRepository.verifyPassword(
      trimmedPassword,
      user[0].passwordHash
    )

    if (!isPasswordValid) {
      logger.error('Invalid password for email: %s', trimmedEmail)
      throw new Error('Invalid email or password!')
    }

    const token = jwtToken.sign({ id: user[0].id, email: user[0].email, role: user[0].role })

    return { user: user[0], token }
  },

  async findUserByEmail(email: string) {
    return await AuthRepository.findUserByEmail(email)
  },
}
