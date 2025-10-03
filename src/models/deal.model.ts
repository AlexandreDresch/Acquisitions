import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  decimal,
  json,
  text,
} from 'drizzle-orm/pg-core'
import { users } from './user.model.ts'
import { relations } from 'drizzle-orm'

export const listings = pgTable('listings', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  sellerId: integer('seller_id')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const deals = pgTable('deals', {
  id: serial('id').primaryKey(),
  listingId: integer('listing_id')
    .references(() => listings.id)
    .notNull(),
  buyerId: integer('buyer_id')
    .references(() => users.id)
    .notNull(),
  offerAmount: decimal('offer_amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  message: text('message'),
  terms: json('terms'),
  expiresAt: timestamp('expires_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const dealMessages = pgTable('deal_messages', {
  id: serial('id').primaryKey(),
  dealId: integer('deal_id')
    .references(() => deals.id)
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const listingsRelations = relations(listings, ({ one, many }) => ({
  seller: one(users, {
    fields: [listings.sellerId],
    references: [users.id],
  }),
  deals: many(deals),
}))

export const dealsRelations = relations(deals, ({ one, many }) => ({
  listing: one(listings, {
    fields: [deals.listingId],
    references: [listings.id],
  }),
  buyer: one(users, {
    fields: [deals.buyerId],
    references: [users.id],
  }),
  messages: many(dealMessages),
}))

export const dealMessagesRelations = relations(dealMessages, ({ one }) => ({
  deal: one(deals, {
    fields: [dealMessages.dealId],
    references: [deals.id],
  }),
  user: one(users, {
    fields: [dealMessages.userId],
    references: [users.id],
  }),
}))
