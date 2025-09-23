import bcrypt from 'bcryptjs'

import { db } from '../config/database.js'
import { users } from '../models/user.model.js'
import { eq } from 'drizzle-orm'

export const AuthRepository = {
  async findUserByEmail(email: string) {
    return await db.select().from(users).where(eq(users.email, email)).limit(1)
  },

  async createUser(username: string, email: string, password: string, role = 'user') {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const [newUser] = await db
      .insert(users)
      .values({
        name: username,
        email,
        passwordHash: hashedPassword,
        role,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.created_at,
      })

    if (!newUser) {
      throw new Error('User creation failed')
    }

    return newUser
  },
}
