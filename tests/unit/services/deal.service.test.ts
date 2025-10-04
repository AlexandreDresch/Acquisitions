/* eslint-disable @typescript-eslint/no-explicit-any */
import { DealService } from '../../../src/services/deal.service.ts'
import { DealRepository } from '../../../src/repositories/deal.repository.ts'
import logger from '../../../src/config/logger.ts'

jest.mock('../../../src/repositories/deal.repository.ts')
jest.mock('../../../src/config/logger.ts')

const mockedDealRepository = DealRepository as jest.Mocked<typeof DealRepository>
const mockedLogger = logger as jest.Mocked<typeof logger>

const createMockListing = (overrides = {}) => ({
  id: 1,
  title: 'Test Listing',
  description: 'Test Description',
  price: '100.00',
  category: 'electronics',
  status: 'active',
  sellerId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

const createMockDeal = (overrides = {}) => ({
  id: 1,
  listingId: 1,
  buyerId: 2,
  offerAmount: '90.00',
  message: 'Test offer',
  terms: { shipping: 'standard' },
  status: 'pending',
  expiresAt: new Date('2024-12-31'),
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: null,
  ...overrides,
})

const createMockMessage = (overrides = {}) => ({
  id: 1,
  dealId: 1,
  userId: 2,
  message: 'Test message',
  createdAt: new Date(),
  ...overrides,
})

describe('DealService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createListing', () => {
    it('should create a listing successfully', async () => {
      const listingData = {
        title: 'Test Listing',
        description: 'Test Description',
        price: '100.00',
        category: 'electronics',
        sellerId: 1,
      }

      const mockListing = createMockListing(listingData)
      mockedDealRepository.createListing.mockResolvedValue(mockListing)

      const result = await DealService.createListing(listingData)

      expect(mockedDealRepository.createListing).toHaveBeenCalledWith(listingData)
      expect(mockedLogger.info).toHaveBeenCalledWith('Listing created', {
        listingId: 1,
        sellerId: 1,
      })
      expect(result).toEqual(mockListing)
    })
  })

  describe('getListing', () => {
    it('should return listing when found', async () => {
      const mockListing = createMockListing()
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)

      const result = await DealService.getListing(1)

      expect(mockedDealRepository.getListingById).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockListing)
    })

    it('should throw error when listing not found', async () => {
      mockedDealRepository.getListingById.mockResolvedValue(undefined as any)

      await expect(DealService.getListing(1)).rejects.toThrow('Listing not found')
      expect(mockedDealRepository.getListingById).toHaveBeenCalledWith(1)
    })
  })

  describe('getUserListings', () => {
    it('should return user listings', async () => {
      const mockListings = [
        createMockListing({ id: 1, title: 'Listing 1' }),
        createMockListing({ id: 2, title: 'Listing 2' }),
      ]
      mockedDealRepository.getUserListings.mockResolvedValue(mockListings)

      const result = await DealService.getUserListings(1)

      expect(mockedDealRepository.getUserListings).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockListings)
    })
  })

  describe('getAllListings', () => {
    it('should return all listings with filters', async () => {
      const filters = { category: 'electronics', minPrice: '100.00' }
      const mockListings = [
        createMockListing({ id: 1, title: 'Listing 1', category: 'electronics', price: '150.00' }),
      ]
      mockedDealRepository.getAllListings.mockResolvedValue(mockListings)

      const result = await DealService.getAllListings(filters)

      expect(mockedDealRepository.getAllListings).toHaveBeenCalledWith(filters)
      expect(result).toEqual(mockListings)
    })

    it('should return all listings without filters', async () => {
      const mockListings = [
        createMockListing({ id: 1, title: 'Listing 1' }),
        createMockListing({ id: 2, title: 'Listing 2' }),
      ]
      mockedDealRepository.getAllListings.mockResolvedValue(mockListings)

      const result = await DealService.getAllListings()

      expect(mockedDealRepository.getAllListings).toHaveBeenCalledWith(undefined)
      expect(result).toEqual(mockListings)
    })
  })

  describe('updateListing', () => {
    it('should update listing when user is owner', async () => {
      const mockListing = createMockListing({ title: 'Old Title' })
      const updates = { title: 'New Title' }
      const mockUpdatedListing = createMockListing({ ...updates })

      mockedDealRepository.getListingById.mockResolvedValue(mockListing)
      mockedDealRepository.updateListing.mockResolvedValue(mockUpdatedListing)

      const result = await DealService.updateListing(1, updates, 1)

      expect(mockedDealRepository.getListingById).toHaveBeenCalledWith(1)
      expect(mockedDealRepository.updateListing).toHaveBeenCalledWith(1, updates)
      expect(mockedLogger.info).toHaveBeenCalledWith('Listing updated', {
        listingId: 1,
        userId: 1,
      })
      expect(result).toEqual(mockUpdatedListing)
    })

    it('should throw error when listing not found', async () => {
      mockedDealRepository.getListingById.mockResolvedValue(undefined as any)

      await expect(DealService.updateListing(1, { title: 'New Title' }, 1)).rejects.toThrow(
        'Listing not found'
      )
    })

    it('should throw error when user is not owner', async () => {
      const mockListing = createMockListing()
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)

      await expect(DealService.updateListing(1, { title: 'New Title' }, 2)).rejects.toThrow(
        'Not authorized to update this listing'
      )
    })
  })

  describe('deleteListing', () => {
    it('should delete listing when user is owner', async () => {
      const mockListing = createMockListing()
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)
      mockedDealRepository.deleteListing.mockResolvedValue(undefined as any)

      await DealService.deleteListing(1, 1)

      expect(mockedDealRepository.getListingById).toHaveBeenCalledWith(1)
      expect(mockedDealRepository.deleteListing).toHaveBeenCalledWith(1)
      expect(mockedLogger.info).toHaveBeenCalledWith('Listing deleted', {
        listingId: 1,
        userId: 1,
      })
    })

    it('should throw error when user is not owner', async () => {
      const mockListing = createMockListing()
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)

      await expect(DealService.deleteListing(1, 2)).rejects.toThrow(
        'Not authorized to delete this listing'
      )
    })
  })

  describe('createDeal', () => {
    const dealData = {
      listingId: 1,
      buyerId: 2,
      offerAmount: '90.00',
      message: 'Test offer',
      terms: { shipping: 'standard' },
      expiresAt: '2024-12-31',
    }

    it('should create a deal successfully', async () => {
      const mockListing = createMockListing({ sellerId: 1, status: 'active' })
      const mockDeal = createMockDeal(dealData)

      mockedDealRepository.getListingById.mockResolvedValue(mockListing)
      mockedDealRepository.getListingDeals.mockResolvedValue([])
      mockedDealRepository.createDeal.mockResolvedValue(mockDeal)

      const result = await DealService.createDeal(dealData)

      expect(mockedDealRepository.getListingById).toHaveBeenCalledWith(1)
      expect(mockedDealRepository.getListingDeals).toHaveBeenCalledWith(1)
      expect(mockedDealRepository.createDeal).toHaveBeenCalledWith({
        ...dealData,
        expiresAt: new Date('2024-12-31'),
      })
      expect(mockedLogger.info).toHaveBeenCalledWith('Deal created', {
        dealId: 1,
        listingId: 1,
        buyerId: 2,
      })
      expect(result).toEqual(mockDeal)
    })

    it('should throw error when listing not found', async () => {
      mockedDealRepository.getListingById.mockResolvedValue(undefined as any)

      await expect(DealService.createDeal(dealData)).rejects.toThrow('Listing not found')
    })

    it('should throw error when listing is not active', async () => {
      const mockListing = createMockListing({ status: 'sold' })
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)

      await expect(DealService.createDeal(dealData)).rejects.toThrow(
        'Listing is not available for deals'
      )
    })

    it('should throw error when buyer is the seller', async () => {
      const mockListing = createMockListing({ sellerId: 2, status: 'active' })
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)

      await expect(DealService.createDeal({ ...dealData, buyerId: 2 })).rejects.toThrow(
        'Cannot create deal on your own listing'
      )
    })

    it('should throw error when pending deal already exists', async () => {
      const mockListing = createMockListing({ sellerId: 1, status: 'active' })
      const mockExistingDeal = createMockDeal({ buyerId: 2, status: 'pending' })

      mockedDealRepository.getListingById.mockResolvedValue(mockListing)
      mockedDealRepository.getListingDeals.mockResolvedValue([mockExistingDeal])

      await expect(DealService.createDeal(dealData)).rejects.toThrow(
        'You already have a pending deal for this listing'
      )
    })

    it('should handle undefined expiresAt', async () => {
      const mockListing = createMockListing({ sellerId: 1, status: 'active' })
      const mockDeal = createMockDeal({ ...dealData, expiresAt: undefined })
      const dealDataWithoutExpires = { ...dealData, expiresAt: undefined }

      mockedDealRepository.getListingById.mockResolvedValue(mockListing)
      mockedDealRepository.getListingDeals.mockResolvedValue([])
      mockedDealRepository.createDeal.mockResolvedValue(mockDeal)

      const result = await DealService.createDeal(dealDataWithoutExpires)

      expect(mockedDealRepository.createDeal).toHaveBeenCalledWith({
        ...dealDataWithoutExpires,
        expiresAt: undefined,
      })
      expect(result).toEqual(mockDeal)
    })
  })

  describe('getDeal', () => {
    it('should return deal when user is buyer', async () => {
      const mockDeal = createMockDeal({ buyerId: 2, status: 'pending' })
      const mockListing = createMockListing({ sellerId: 1 })

      mockedDealRepository.getDealById.mockResolvedValue(mockDeal)
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)

      const result = await DealService.getDeal(1, 2)

      expect(mockedDealRepository.getDealById).toHaveBeenCalledWith(1)
      expect(mockedDealRepository.getListingById).toHaveBeenCalledWith(1)
      expect(result).toEqual({ deal: mockDeal, listing: mockListing })
    })

    it('should return deal when user is seller', async () => {
      const mockDeal = createMockDeal({ buyerId: 2, status: 'pending' })
      const mockListing = createMockListing({ sellerId: 1 })

      mockedDealRepository.getDealById.mockResolvedValue(mockDeal)
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)

      const result = await DealService.getDeal(1, 1)

      expect(result).toEqual({ deal: mockDeal, listing: mockListing })
    })

    it('should throw error when deal not found', async () => {
      mockedDealRepository.getDealById.mockResolvedValue(undefined as any)

      await expect(DealService.getDeal(1, 1)).rejects.toThrow('Deal not found')
    })

    it('should throw error when user is not authorized', async () => {
      const mockDeal = createMockDeal({ buyerId: 2, status: 'pending' })
      const mockListing = createMockListing({ sellerId: 1 })

      mockedDealRepository.getDealById.mockResolvedValue(mockDeal)
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)

      await expect(DealService.getDeal(1, 3)).rejects.toThrow('Not authorized to view this deal')
    })
  })

  describe('getUserDeals', () => {
    it('should return user deals as buyer', async () => {
      const mockDeals = [
        createMockDeal({ id: 1, buyerId: 2 }),
        createMockDeal({ id: 2, buyerId: 2 }),
      ]
      mockedDealRepository.getUserDeals.mockResolvedValue(mockDeals)

      const result = await DealService.getUserDeals(2, 'buyer')

      expect(mockedDealRepository.getUserDeals).toHaveBeenCalledWith(2, 'buyer')
      expect(result).toEqual(mockDeals)
    })

    it('should return user deals as seller', async () => {
      const mockDeals = [createMockDeal({ id: 1, buyerId: 2 })]
      mockedDealRepository.getUserDeals.mockResolvedValue(mockDeals)

      const result = await DealService.getUserDeals(1, 'seller')

      expect(mockedDealRepository.getUserDeals).toHaveBeenCalledWith(1, 'seller')
      expect(result).toEqual(mockDeals)
    })
  })

  describe('updateDeal', () => {
    it('should allow seller to accept deal', async () => {
      const mockDeal = createMockDeal({ buyerId: 2, status: 'pending' })
      const mockListing = createMockListing({ sellerId: 1 })
      const mockUpdatedDeal = createMockDeal({ ...mockDeal, status: 'accepted' })

      mockedDealRepository.getDealById.mockResolvedValue(mockDeal)
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)
      mockedDealRepository.updateDeal.mockResolvedValue(mockUpdatedDeal)

      const result = await DealService.updateDeal(1, { status: 'accepted' }, 1)

      expect(mockedDealRepository.updateDeal).toHaveBeenCalledWith(1, { status: 'accepted' })
      expect(mockedLogger.info).toHaveBeenCalledWith('Deal updated', {
        dealId: 1,
        updates: { status: 'accepted' },
        userId: 1,
      })
      expect(result).toEqual(mockUpdatedDeal)
    })

    it('should allow buyer to cancel deal', async () => {
      const mockDeal = createMockDeal({ buyerId: 2, status: 'pending' })
      const mockListing = createMockListing({ sellerId: 1 })
      const mockUpdatedDeal = createMockDeal({ ...mockDeal, status: 'cancelled' })

      mockedDealRepository.getDealById.mockResolvedValue(mockDeal)
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)
      mockedDealRepository.updateDeal.mockResolvedValue(mockUpdatedDeal)

      const result = await DealService.updateDeal(1, { status: 'cancelled' }, 2)

      expect(mockedDealRepository.updateDeal).toHaveBeenCalledWith(1, { status: 'cancelled' })
      expect(result).toEqual(mockUpdatedDeal)
    })

    it('should throw error when non-seller tries to accept deal', async () => {
      const mockDeal = createMockDeal({ buyerId: 2, status: 'pending' })
      const mockListing = createMockListing({ sellerId: 1 })

      mockedDealRepository.getDealById.mockResolvedValue(mockDeal)
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)

      await expect(DealService.updateDeal(1, { status: 'accepted' }, 3)).rejects.toThrow(
        'Only the seller can accept or reject deals'
      )
    })

    it('should throw error when non-buyer tries to cancel deal', async () => {
      const mockDeal = createMockDeal({ buyerId: 2, status: 'pending' })
      const mockListing = createMockListing({ sellerId: 1 })

      mockedDealRepository.getDealById.mockResolvedValue(mockDeal)
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)

      await expect(DealService.updateDeal(1, { status: 'cancelled' }, 3)).rejects.toThrow(
        'Only the buyer can cancel this deal'
      )
    })
  })

  describe('acceptDeal', () => {
    it('should accept deal successfully', async () => {
      const mockDeal = createMockDeal({ buyerId: 2, status: 'pending' })
      const mockListing = createMockListing({ sellerId: 1, status: 'active' })
      const mockAcceptedDeal = createMockDeal({ ...mockDeal, status: 'accepted' })
      const mockUpdatedListing = createMockListing({ ...mockListing, status: 'sold' })

      mockedDealRepository.getDealById.mockResolvedValue(mockDeal)
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)
      mockedDealRepository.acceptDeal.mockResolvedValue(mockAcceptedDeal)
      mockedDealRepository.updateListing.mockResolvedValue(mockUpdatedListing)

      const result = await DealService.acceptDeal(1, 1)

      expect(mockedDealRepository.acceptDeal).toHaveBeenCalledWith(1)
      expect(mockedDealRepository.updateListing).toHaveBeenCalledWith(1, { status: 'sold' })
      expect(mockedLogger.info).toHaveBeenCalledWith('Deal accepted', {
        dealId: 1,
        userId: 1,
      })
      expect(result).toEqual(mockAcceptedDeal)
    })

    it('should throw error when user is not seller', async () => {
      const mockDeal = createMockDeal({ buyerId: 2, status: 'pending' })
      const mockListing = createMockListing({ sellerId: 1 })

      mockedDealRepository.getDealById.mockResolvedValue(mockDeal)
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)

      await expect(DealService.acceptDeal(1, 2)).rejects.toThrow('Only the seller can accept deals')
    })

    it('should throw error when deal is not pending', async () => {
      const mockDeal = createMockDeal({ buyerId: 2, status: 'accepted' })
      const mockListing = createMockListing({ sellerId: 1 })

      mockedDealRepository.getDealById.mockResolvedValue(mockDeal)
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)

      await expect(DealService.acceptDeal(1, 1)).rejects.toThrow(
        'Only pending deals can be accepted'
      )
    })
  })

  describe('completeDeal', () => {
    it('should complete deal successfully', async () => {
      const mockDeal = createMockDeal({ buyerId: 2, status: 'accepted' })
      const mockListing = createMockListing({ sellerId: 1 })
      const mockCompletedDeal = createMockDeal({
        ...mockDeal,
        status: 'completed',
        completedAt: new Date(),
      })

      mockedDealRepository.getDealById.mockResolvedValue(mockDeal)
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)
      mockedDealRepository.completeDeal.mockResolvedValue(mockCompletedDeal)

      const result = await DealService.completeDeal(1, 1)

      expect(mockedDealRepository.completeDeal).toHaveBeenCalledWith(1)
      expect(mockedLogger.info).toHaveBeenCalledWith('Deal completed', {
        dealId: 1,
        userId: 1,
      })
      expect(result).toEqual(mockCompletedDeal)
    })

    it('should throw error when user is not seller', async () => {
      const mockDeal = createMockDeal({ buyerId: 2, status: 'accepted' })
      const mockListing = createMockListing({ sellerId: 1 })

      mockedDealRepository.getDealById.mockResolvedValue(mockDeal)
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)

      await expect(DealService.completeDeal(1, 2)).rejects.toThrow(
        'Only the seller can complete deals'
      )
    })

    it('should throw error when deal is not accepted', async () => {
      const mockDeal = createMockDeal({ buyerId: 2, status: 'pending' })
      const mockListing = createMockListing({ sellerId: 1 })

      mockedDealRepository.getDealById.mockResolvedValue(mockDeal)
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)

      await expect(DealService.completeDeal(1, 1)).rejects.toThrow(
        'Only accepted deals can be completed'
      )
    })
  })

  describe('addMessage', () => {
    it('should add message when user is buyer', async () => {
      const mockDeal = createMockDeal({ buyerId: 2, status: 'pending' })
      const mockListing = createMockListing({ sellerId: 1 })
      const mockMessage = createMockMessage({ userId: 2, message: 'Hello' })

      mockedDealRepository.getDealById.mockResolvedValue(mockDeal)
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)
      mockedDealRepository.addMessage.mockResolvedValue(mockMessage)

      const result = await DealService.addMessage(1, 2, { message: 'Hello' })

      expect(mockedDealRepository.addMessage).toHaveBeenCalledWith(1, 2, 'Hello')
      expect(mockedLogger.info).toHaveBeenCalledWith('Message added to deal', {
        dealId: 1,
        userId: 2,
        messageId: 1,
      })
      expect(result).toEqual(mockMessage)
    })

    it('should add message when user is seller', async () => {
      const mockDeal = createMockDeal({ buyerId: 2, status: 'pending' })
      const mockListing = createMockListing({ sellerId: 1 })
      const mockMessage = createMockMessage({ userId: 1, message: 'Hi there' })

      mockedDealRepository.getDealById.mockResolvedValue(mockDeal)
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)
      mockedDealRepository.addMessage.mockResolvedValue(mockMessage)

      const result = await DealService.addMessage(1, 1, { message: 'Hi there' })

      expect(mockedDealRepository.addMessage).toHaveBeenCalledWith(1, 1, 'Hi there')
      expect(result).toEqual(mockMessage)
    })

    it('should throw error when user is not authorized', async () => {
      const mockDeal = createMockDeal({ buyerId: 2, status: 'pending' })
      const mockListing = createMockListing({ sellerId: 1 })

      mockedDealRepository.getDealById.mockResolvedValue(mockDeal)
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)

      await expect(DealService.addMessage(1, 3, { message: 'Hello' })).rejects.toThrow(
        'Not authorized to message in this deal'
      )
    })
  })

  describe('getDealMessages', () => {
    it('should return messages when user is buyer', async () => {
      const mockDeal = createMockDeal({ buyerId: 2, status: 'pending' })
      const mockListing = createMockListing({ sellerId: 1 })
      const mockMessages = [
        createMockMessage({ userId: 2, message: 'Hello' }),
        createMockMessage({ userId: 1, message: 'Hi' }),
      ]

      mockedDealRepository.getDealById.mockResolvedValue(mockDeal)
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)
      mockedDealRepository.getDealMessages.mockResolvedValue(mockMessages)

      const result = await DealService.getDealMessages(1, 2)

      expect(mockedDealRepository.getDealMessages).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockMessages)
    })

    it('should throw error when user is not authorized', async () => {
      const mockDeal = createMockDeal({ buyerId: 2, status: 'pending' })
      const mockListing = createMockListing({ sellerId: 1 })

      mockedDealRepository.getDealById.mockResolvedValue(mockDeal)
      mockedDealRepository.getListingById.mockResolvedValue(mockListing)

      await expect(DealService.getDealMessages(1, 3)).rejects.toThrow(
        'Not authorized to view messages for this deal'
      )
    })
  })
})
