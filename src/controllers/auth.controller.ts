import type { Request, Response, NextFunction } from 'express'

import { AuthService } from '../services/auth.service.ts'
import { cookies } from '../utils/cookies.ts'

export const AuthController = {
  async signUp(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, email, password, role } = req.body

      const result = await AuthService.signUp(username, email, password, role)

      cookies.set(res, 'token', result.token)

      res.status(201).json({
        success: true,
        message: 'User created successfully!',
        data: result,
      })
    } catch (error) {
      next(error)
    }
  },

  async signIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body

      const result = await AuthService.signIn(email, password)

      cookies.set(res, 'token', result.token)

      res.status(200).json({
        success: true,
        message: 'User signed in successfully!',
        data: result,
      })
    } catch (error) {
      next(error)
    }
  },

  async signOut(_req: Request, res: Response, next: NextFunction) {
    try {
      cookies.clear(res, 'token')

      res.status(200).json({
        success: true,
        message: 'User signed out successfully!',
      })
    } catch (error) {
      next(error)
    }
  },
}
