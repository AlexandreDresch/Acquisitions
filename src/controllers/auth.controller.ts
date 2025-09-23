import type { Request, Response, NextFunction } from 'express'

import { AuthService } from '../services/auth.service.js'
import { cookies } from '../utils/cookies.js'

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
}
