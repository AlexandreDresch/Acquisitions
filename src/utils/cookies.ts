import { CookieOptions, Response } from 'express'

export const cookies = {
  getOptions: (): CookieOptions => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  }),

  set: (res: Response, name: string, value: string, options = {}) =>
    res.cookie(name, value, { ...cookies.getOptions(), ...options }),

  clear: (res: Response, name: string, options = {}) =>
    res.clearCookie(name, { ...cookies.getOptions(), ...options }),

  get: (req: { cookies: { [key: string]: string } }, name: string): string | undefined =>
    req.cookies[name],
}
