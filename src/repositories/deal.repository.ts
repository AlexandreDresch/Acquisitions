import { db } from '../config/database.ts'
import { listings, deals, dealMessages } from '../models/deal.model.ts'
import { eq, and, desc, asc, sql } from 'drizzle-orm'

export const DealRepository = {
  async createListing(listingData: {
    title: string
    description?: string
    price: string
    category: string
    sellerId: number
  }) {
    const [newListing] = await db.insert(listings).values(listingData).returning()

    return newListing
  },

  async getListingById(id: number) {
    const [listing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1)

    return listing
  },

  async getUserListings(userId: number) {
    return await db
      .select()
      .from(listings)
      .where(eq(listings.sellerId, userId))
      .orderBy(desc(listings.createdAt))
  },

  async getAllListings(filters?: {
    category?: string
    minPrice?: string
    maxPrice?: string
    status?: string
  }) {
    const conditions = []

    if (filters?.category) {
      conditions.push(eq(listings.category, filters.category))
    }

    if (filters?.minPrice) {
      conditions.push(sql`${listings.price} >= ${filters.minPrice}`)
    }

    if (filters?.maxPrice) {
      conditions.push(sql`${listings.price} <= ${filters.maxPrice}`)
    }

    if (filters?.status) {
      conditions.push(eq(listings.status, filters.status))
    }

    return await db
      .select()
      .from(listings)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(listings.createdAt))
  },

  async updateListing(id: number, updates: Partial<typeof listings.$inferInsert>) {
    const [updatedListing] = await db
      .update(listings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning()

    return updatedListing
  },

  async deleteListing(id: number) {
    return await db.delete(listings).where(eq(listings.id, id))
  },

  async createDeal(dealData: {
    listingId: number
    buyerId: number
    offerAmount: string
    message?: string
    terms?: Record<string, unknown>
    expiresAt?: Date
  }) {
    const [newDeal] = await db.insert(deals).values(dealData).returning()

    return newDeal
  },

  async getDealById(id: number) {
    const [deal] = await db.select().from(deals).where(eq(deals.id, id)).limit(1)

    return deal
  },

  async getUserDeals(userId: number, role: 'buyer' | 'seller' = 'buyer') {
    if (role === 'buyer') {
      return await db
        .select()
        .from(deals)
        .where(eq(deals.buyerId, userId))
        .orderBy(desc(deals.createdAt))
    } else {
      return await db
        .select()
        .from(deals)
        .innerJoin(listings, eq(deals.listingId, listings.id))
        .where(eq(listings.sellerId, userId))
        .orderBy(desc(deals.createdAt))
    }
  },

  async getListingDeals(listingId: number) {
    return await db
      .select()
      .from(deals)
      .where(eq(deals.listingId, listingId))
      .orderBy(desc(deals.createdAt))
  },

  async updateDeal(id: number, updates: Partial<typeof deals.$inferInsert>) {
    const [updatedDeal] = await db
      .update(deals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning()

    return updatedDeal
  },

  async acceptDeal(dealId: number) {
    await db
      .update(deals)
      .set({ status: 'rejected', updatedAt: new Date() })
      .where(
        and(
          eq(deals.listingId, sql`(SELECT listing_id FROM deals WHERE id = ${dealId})`),
          eq(deals.status, 'pending'),
          eq(deals.id, sql`!= ${dealId}`)
        )
      )

    const [acceptedDeal] = await db
      .update(deals)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(deals.id, dealId))
      .returning()

    return acceptedDeal
  },

  async completeDeal(dealId: number) {
    const [completedDeal] = await db
      .update(deals)
      .set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() })
      .where(eq(deals.id, dealId))
      .returning()

    return completedDeal
  },

  async addMessage(dealId: number, userId: number, message: string) {
    const [newMessage] = await db
      .insert(dealMessages)
      .values({ dealId, userId, message })
      .returning()

    return newMessage
  },

  async getDealMessages(dealId: number) {
    return await db
      .select()
      .from(dealMessages)
      .where(eq(dealMessages.dealId, dealId))
      .orderBy(asc(dealMessages.createdAt))
  },
}
