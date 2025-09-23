import { z } from 'zod'

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Name is required and must be at least 2 characters long' })
    .max(100, { message: 'Name must not exceed 100 characters' }),

  email: z
    .email({ message: 'Invalid email address' })
    .trim()
    .toLowerCase()
    .max(255, { message: 'Email must not exceed 255 characters' }),

  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long' })
    .max(100, { message: 'Password must not exceed 100 characters' }),

  role: z
    .enum(['user', 'admin'], {
      message: "Role must be either 'user' or 'admin'",
    })
    .default('user'),
})

export const signInSchema = z.object({
  email: z
    .email({ message: 'Invalid email address' })
    .trim()
    .toLowerCase()
    .max(255, { message: 'Email must not exceed 255 characters' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long' })
    .max(100, { message: 'Password must not exceed 100 characters' }),
})
