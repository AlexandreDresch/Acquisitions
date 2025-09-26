import { eq } from 'drizzle-orm'
import { db } from '../config/database.ts'
import { users } from '../models/user.model.ts'
import { UserUpdate } from '../services/users.service.ts'

export const UsersRepository = {
  async findAll() {
    return await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.created_at,
        updatedAt: users.updated_at,
      })
      .from(users)
  },

  async findById(id: string) {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.created_at,
        updatedAt: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, id as unknown as number))
      .limit(1)

    return user ?? null
  },

  async update(id: string, updates: UserUpdate) {
    return await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id as unknown as number))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.created_at,
        updatedAt: users.updated_at,
      })
  },

  async delete(id: string) {
    return await db.delete(users).where(eq(users.id, id as unknown as number))
  },
}
