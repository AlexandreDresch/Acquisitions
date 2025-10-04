export interface AuthenticatedUser {
  id: number
  email: string
  role: string
}

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser
  }
}
