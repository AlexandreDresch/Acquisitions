import { DealRepository } from '../repositories/deal.repository.ts'
import {
  CreateListingInput,
  UpdateListingInput,
  CreateDealInput,
  UpdateDealInput,
  DealMessageInput,
} from '../schemas/deal.validation.ts'
import logger from '../config/logger.ts'

export const DealService = {
  async createListing(listingData: CreateListingInput & { sellerId: number }) {
    const newListing = await DealRepository.createListing(listingData)
    logger.info('Listing created', { listingId: newListing.id, sellerId: listingData.sellerId })
    return newListing
  },

  async getListing(id: number) {
    const listing = await DealRepository.getListingById(id)
    if (!listing) {
      throw new Error('Listing not found')
    }
    return listing
  },

  async getUserListings(userId: number) {
    return await DealRepository.getUserListings(userId)
  },

  async getAllListings(filters?: {
    category?: string
    minPrice?: string
    maxPrice?: string
    status?: string
  }) {
    return await DealRepository.getAllListings(filters)
  },

  async updateListing(id: number, updates: UpdateListingInput, userId: number) {
    const listing = await DealRepository.getListingById(id)
    if (!listing) {
      throw new Error('Listing not found')
    }

    if (listing.sellerId !== userId) {
      throw new Error('Not authorized to update this listing')
    }

    const updatedListing = await DealRepository.updateListing(id, updates)
    logger.info('Listing updated', { listingId: id, userId })
    return updatedListing
  },

  async deleteListing(id: number, userId: number) {
    const listing = await DealRepository.getListingById(id)
    if (!listing) {
      throw new Error('Listing not found')
    }

    if (listing.sellerId !== userId) {
      throw new Error('Not authorized to delete this listing')
    }

    await DealRepository.deleteListing(id)
    logger.info('Listing deleted', { listingId: id, userId })
  },

  async createDeal(dealData: CreateDealInput & { buyerId: number }) {
    const listing = await DealRepository.getListingById(dealData.listingId)
    if (!listing) {
      throw new Error('Listing not found')
    }

    if (listing.status !== 'active') {
      throw new Error('Listing is not available for deals')
    }

    if (listing.sellerId === dealData.buyerId) {
      throw new Error('Cannot create deal on your own listing')
    }

    const existingDeals = await DealRepository.getListingDeals(dealData.listingId)
    const existingDeal = existingDeals.find(
      (deal) => deal.buyerId === dealData.buyerId && deal.status === 'pending'
    )

    if (existingDeal) {
      throw new Error('You already have a pending deal for this listing')
    }

    const repositoryData = {
      ...dealData,
      expiresAt: dealData.expiresAt ? new Date(dealData.expiresAt) : undefined,
    }

    const newDeal = await DealRepository.createDeal(repositoryData)
    logger.info('Deal created', {
      dealId: newDeal.id,
      listingId: dealData.listingId,
      buyerId: dealData.buyerId,
    })
    return newDeal
  },

  async getDeal(id: number, userId: number) {
    const deal = await DealRepository.getDealById(id)
    if (!deal) {
      throw new Error('Deal not found')
    }

    const listing = await DealRepository.getListingById(deal.listingId)
    if (deal.buyerId !== userId && listing.sellerId !== userId) {
      throw new Error('Not authorized to view this deal')
    }

    return { deal, listing }
  },

  async getUserDeals(userId: number, role: 'buyer' | 'seller' = 'buyer') {
    return await DealRepository.getUserDeals(userId, role)
  },

  async updateDeal(id: number, updates: UpdateDealInput, userId: number) {
    const deal = await DealRepository.getDealById(id)
    if (!deal) {
      throw new Error('Deal not found')
    }

    const listing = await DealRepository.getListingById(deal.listingId)

    if (updates.status === 'accepted' || updates.status === 'rejected') {
      if (listing.sellerId !== userId) {
        throw new Error('Only the seller can accept or reject deals')
      }
    } else if (updates.status === 'cancelled') {
      if (deal.buyerId !== userId) {
        throw new Error('Only the buyer can cancel this deal')
      }
    }

    const updatedDeal = await DealRepository.updateDeal(id, updates)
    logger.info('Deal updated', { dealId: id, updates, userId })
    return updatedDeal
  },

  async acceptDeal(dealId: number, userId: number) {
    const deal = await DealRepository.getDealById(dealId)
    if (!deal) {
      throw new Error('Deal not found')
    }

    const listing = await DealRepository.getListingById(deal.listingId)
    if (listing.sellerId !== userId) {
      throw new Error('Only the seller can accept deals')
    }

    if (deal.status !== 'pending') {
      throw new Error('Only pending deals can be accepted')
    }

    const acceptedDeal = await DealRepository.acceptDeal(dealId)

    await DealRepository.updateListing(listing.id, { status: 'sold' })

    logger.info('Deal accepted', { dealId, userId })
    return acceptedDeal
  },

  async completeDeal(dealId: number, userId: number) {
    const deal = await DealRepository.getDealById(dealId)
    if (!deal) {
      throw new Error('Deal not found')
    }

    const listing = await DealRepository.getListingById(deal.listingId)

    if (listing.sellerId !== userId) {
      throw new Error('Only the seller can complete deals')
    }

    if (deal.status !== 'accepted') {
      throw new Error('Only accepted deals can be completed')
    }

    const completedDeal = await DealRepository.completeDeal(dealId)
    logger.info('Deal completed', { dealId, userId })
    return completedDeal
  },

  async addMessage(dealId: number, userId: number, messageData: DealMessageInput) {
    const deal = await DealRepository.getDealById(dealId)
    if (!deal) {
      throw new Error('Deal not found')
    }

    const listing = await DealRepository.getListingById(deal.listingId)

    if (deal.buyerId !== userId && listing.sellerId !== userId) {
      throw new Error('Not authorized to message in this deal')
    }

    const newMessage = await DealRepository.addMessage(dealId, userId, messageData.message)
    logger.info('Message added to deal', { dealId, userId, messageId: newMessage.id })
    return newMessage
  },

  async getDealMessages(dealId: number, userId: number) {
    const deal = await DealRepository.getDealById(dealId)
    if (!deal) {
      throw new Error('Deal not found')
    }

    const listing = await DealRepository.getListingById(deal.listingId)

    if (deal.buyerId !== userId && listing.sellerId !== userId) {
      throw new Error('Not authorized to view messages for this deal')
    }

    return await DealRepository.getDealMessages(dealId)
  },
}
