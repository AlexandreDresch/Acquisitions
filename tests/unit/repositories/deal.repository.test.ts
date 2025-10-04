/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '../../../src/config/database.ts'
import { listings, deals, dealMessages } from '../../../src/models/deal.model.ts'
import { eq, and, desc, asc, sql } from 'drizzle-orm'
import { DealRepository } from '../../../src/repositories/deal.repository.ts'

jest.mock('../../../src/config/database.ts', () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}))

jest.mock('../../../src/models/deal.model.ts', () => ({
  listings: {
    id: 'id',
    title: 'title',
    description: 'description',
    price: 'price',
    category: 'category',
    sellerId: 'sellerId',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  deals: {
    id: 'id',
    listingId: 'listingId',
    buyerId: 'buyerId',
    offerAmount: 'offerAmount',
    message: 'message',
    terms: 'terms',
    status: 'status',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    completedAt: 'completedAt',
  },
  dealMessages: {
    id: 'id',
    dealId: 'dealId',
    userId: 'userId',
    message: 'message',
    createdAt: 'createdAt',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  desc: jest.fn(),
  asc: jest.fn(),
  sql: jest.fn((strings, ...values) => {
    return {
      _tag: 'sql',
      strings,
      values,
    } as any
  }),
}))

const mockedDb = db as jest.Mocked<typeof db>
const mockedEq = eq as jest.MockedFunction<typeof eq>
const mockedAnd = and as jest.MockedFunction<typeof and>
const mockedDesc = desc as jest.MockedFunction<typeof desc>
const mockedAsc = asc as jest.MockedFunction<typeof asc>
const mockedSql = sql as jest.MockedFunction<typeof sql>

describe('DealRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createListing', () => {
    it('should create a new listing', async () => {
      const listingData = {
        title: 'Test Listing',
        description: 'Test Description',
        price: '100.00',
        category: 'electronics',
        sellerId: 1,
      }

      const mockListing = { id: 1, ...listingData, createdAt: new Date(), updatedAt: new Date() }
      const mockInsert = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockListing]),
      }

      mockedDb.insert.mockReturnValue(mockInsert as any)

      const result = await DealRepository.createListing(listingData)

      expect(mockedDb.insert).toHaveBeenCalledWith(listings)
      expect(mockInsert.values).toHaveBeenCalledWith(listingData)
      expect(result).toEqual(mockListing)
    })
  })

  describe('getListingById', () => {
    it('should return a listing by id', async () => {
      const mockListing = {
        id: 1,
        title: 'Test Listing',
        price: '100.00',
        sellerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockListing]),
      }

      mockedDb.select.mockReturnValue(mockSelect as any)
      mockedEq.mockReturnValue({} as any)

      const result = await DealRepository.getListingById(1)

      expect(mockedDb.select).toHaveBeenCalled()
      expect(mockSelect.from).toHaveBeenCalledWith(listings)
      expect(mockSelect.where).toHaveBeenCalledWith({})
      expect(mockedEq).toHaveBeenCalledWith(listings.id, 1)
      expect(result).toEqual(mockListing)
    })

    it('should return undefined when listing not found', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      }

      mockedDb.select.mockReturnValue(mockSelect as any)
      mockedEq.mockReturnValue({} as any)

      const result = await DealRepository.getListingById(999)

      expect(result).toBeUndefined()
    })
  })

  describe('getUserListings', () => {
    it('should return user listings sorted by creation date', async () => {
      const mockListings = [
        { id: 1, title: 'Listing 1', sellerId: 1 },
        { id: 2, title: 'Listing 2', sellerId: 1 },
      ]

      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockListings),
      }

      mockedDb.select.mockReturnValue(mockSelect as any)
      mockedEq.mockReturnValue({} as any)
      mockedDesc.mockReturnValue({} as any)

      const result = await DealRepository.getUserListings(1)

      expect(mockedDb.select).toHaveBeenCalled()
      expect(mockSelect.from).toHaveBeenCalledWith(listings)
      expect(mockSelect.where).toHaveBeenCalledWith({})
      expect(mockedEq).toHaveBeenCalledWith(listings.sellerId, 1)
      expect(mockSelect.orderBy).toHaveBeenCalledWith({})
      expect(mockedDesc).toHaveBeenCalledWith(listings.createdAt)
      expect(result).toEqual(mockListings)
    })
  })

  describe('getAllListings', () => {
    it('should apply price range filters', async () => {
      const mockListings = [{ id: 1, title: 'Affordable Listing', price: '50.00' }]

      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockListings),
      }

      mockedDb.select.mockReturnValue(mockSelect as any)
      mockedAnd.mockReturnValue({} as any)

      const result = await DealRepository.getAllListings({
        minPrice: '10.00',
        maxPrice: '100.00',
      })

      expect(mockedSql).toHaveBeenCalledTimes(2)

      const sqlCalls = mockedSql.mock.calls

      expect(sqlCalls[0][0].some((part: string) => part.includes('>='))).toBe(true)
      expect(sqlCalls[0][1]).toBe(listings.price)
      expect(sqlCalls[0][2]).toBe('10.00')

      expect(sqlCalls[1][0].some((part: string) => part.includes('<='))).toBe(true)
      expect(sqlCalls[1][1]).toBe(listings.price)
      expect(sqlCalls[1][2]).toBe('100.00')

      expect(result).toEqual(mockListings)
    })
  })

  describe('updateListing', () => {
    it('should update a listing', async () => {
      const updates = { title: 'Updated Title', price: '150.00' }
      const mockUpdatedListing = { id: 1, ...updates, updatedAt: new Date() }

      const mockUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockUpdatedListing]),
      }

      mockedDb.update.mockReturnValue(mockUpdate as any)
      mockedEq.mockReturnValue({} as any)

      const result = await DealRepository.updateListing(1, updates)

      expect(mockedDb.update).toHaveBeenCalledWith(listings)
      expect(mockUpdate.set).toHaveBeenCalledWith({
        ...updates,
        updatedAt: expect.any(Date),
      })
      expect(mockUpdate.where).toHaveBeenCalledWith({})
      expect(mockedEq).toHaveBeenCalledWith(listings.id, 1)
      expect(result).toEqual(mockUpdatedListing)
    })
  })

  describe('deleteListing', () => {
    it('should delete a listing', async () => {
      const mockDelete = {
        where: jest.fn().mockResolvedValue(undefined),
      }

      mockedDb.delete.mockReturnValue(mockDelete as any)
      mockedEq.mockReturnValue({} as any)

      await DealRepository.deleteListing(1)

      expect(mockedDb.delete).toHaveBeenCalledWith(listings)
      expect(mockDelete.where).toHaveBeenCalledWith({})
      expect(mockedEq).toHaveBeenCalledWith(listings.id, 1)
    })
  })

  describe('createDeal', () => {
    it('should create a new deal', async () => {
      const dealData = {
        listingId: 1,
        buyerId: 2,
        offerAmount: '90.00',
        message: 'Test offer',
        terms: { shipping: 'standard' },
        expiresAt: new Date('2024-12-31'),
      }

      const mockDeal = { id: 1, ...dealData, createdAt: new Date(), updatedAt: new Date() }
      const mockInsert = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockDeal]),
      }

      mockedDb.insert.mockReturnValue(mockInsert as any)

      const result = await DealRepository.createDeal(dealData)

      expect(mockedDb.insert).toHaveBeenCalledWith(deals)
      expect(mockInsert.values).toHaveBeenCalledWith(dealData)
      expect(result).toEqual(mockDeal)
    })
  })

  describe('getDealById', () => {
    it('should return a deal by id', async () => {
      const mockDeal = {
        id: 1,
        listingId: 1,
        buyerId: 2,
        offerAmount: '90.00',
        status: 'pending',
        createdAt: new Date(),
      }

      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockDeal]),
      }

      mockedDb.select.mockReturnValue(mockSelect as any)
      mockedEq.mockReturnValue({} as any)

      const result = await DealRepository.getDealById(1)

      expect(mockedDb.select).toHaveBeenCalled()
      expect(mockSelect.from).toHaveBeenCalledWith(deals)
      expect(result).toEqual(mockDeal)
    })
  })

  describe('getUserDeals', () => {
    it('should return buyer deals', async () => {
      const mockDeals = [
        { id: 1, buyerId: 2, listingId: 1 },
        { id: 2, buyerId: 2, listingId: 3 },
      ]

      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockDeals),
      }

      mockedDb.select.mockReturnValue(mockSelect as any)
      mockedEq.mockReturnValue({} as any)
      mockedDesc.mockReturnValue({} as any)

      const result = await DealRepository.getUserDeals(2, 'buyer')

      expect(mockedDb.select).toHaveBeenCalled()
      expect(mockSelect.from).toHaveBeenCalledWith(deals)
      expect(mockSelect.where).toHaveBeenCalledWith({})
      expect(mockedEq).toHaveBeenCalledWith(deals.buyerId, 2)
      expect(result).toEqual(mockDeals)
    })

    it('should return seller deals', async () => {
      const mockDeals = [
        { id: 1, listingId: 1, buyerId: 2 },
        { id: 2, listingId: 1, buyerId: 3 },
      ]

      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockDeals),
      }

      mockedDb.select.mockReturnValue(mockSelect as any)
      mockedEq.mockImplementation(() => ({}) as any)
      mockedDesc.mockReturnValue({} as any)

      const result = await DealRepository.getUserDeals(1, 'seller')

      expect(mockedDb.select).toHaveBeenCalled()
      expect(mockSelect.innerJoin).toHaveBeenCalledWith(listings, {})
      expect(result).toEqual(mockDeals)
    })
  })

  describe('getListingDeals', () => {
    it('should return deals for a listing', async () => {
      const mockDeals = [
        { id: 1, listingId: 1, buyerId: 2 },
        { id: 2, listingId: 1, buyerId: 3 },
      ]

      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockDeals),
      }

      mockedDb.select.mockReturnValue(mockSelect as any)
      mockedEq.mockReturnValue({} as any)
      mockedDesc.mockReturnValue({} as any)

      const result = await DealRepository.getListingDeals(1)

      expect(mockedDb.select).toHaveBeenCalled()
      expect(mockSelect.from).toHaveBeenCalledWith(deals)
      expect(mockSelect.where).toHaveBeenCalledWith({})
      expect(mockedEq).toHaveBeenCalledWith(deals.listingId, 1)
      expect(result).toEqual(mockDeals)
    })
  })

  describe('updateDeal', () => {
    it('should update a deal', async () => {
      const updates = { status: 'accepted', offerAmount: '95.00' }
      const mockUpdatedDeal = { id: 1, ...updates, updatedAt: new Date() }

      const mockUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockUpdatedDeal]),
      }

      mockedDb.update.mockReturnValue(mockUpdate as any)
      mockedEq.mockReturnValue({} as any)

      const result = await DealRepository.updateDeal(1, updates)

      expect(mockedDb.update).toHaveBeenCalledWith(deals)
      expect(mockUpdate.set).toHaveBeenCalledWith({
        ...updates,
        updatedAt: expect.any(Date),
      })
      expect(result).toEqual(mockUpdatedDeal)
    })
  })

  describe('acceptDeal', () => {
    it('should accept a deal and reject others', async () => {
      const mockAcceptedDeal = { id: 1, status: 'accepted', updatedAt: new Date() }

      const mockUpdate1 = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      }

      const mockUpdate2 = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockAcceptedDeal]),
      }

      mockedDb.update
        .mockReturnValueOnce(mockUpdate1 as any)
        .mockReturnValueOnce(mockUpdate2 as any)

      mockedEq.mockReturnValue({} as any)
      mockedAnd.mockReturnValue({} as any)
      mockedSql.mockReturnValue({} as any)

      const result = await DealRepository.acceptDeal(1)

      expect(mockedDb.update).toHaveBeenCalledTimes(2)
      expect(result).toEqual(mockAcceptedDeal)
    })
  })

  describe('completeDeal', () => {
    it('should complete a deal', async () => {
      const mockCompletedDeal = {
        id: 1,
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      }

      const mockUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockCompletedDeal]),
      }

      mockedDb.update.mockReturnValue(mockUpdate as any)
      mockedEq.mockReturnValue({} as any)

      const result = await DealRepository.completeDeal(1)

      expect(mockedDb.update).toHaveBeenCalledWith(deals)
      expect(mockUpdate.set).toHaveBeenCalledWith({
        status: 'completed',
        completedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
      expect(result).toEqual(mockCompletedDeal)
    })
  })

  describe('addMessage', () => {
    it('should add a message to a deal', async () => {
      const messageData = {
        dealId: 1,
        userId: 2,
        message: 'Test message',
      }

      const mockMessage = { id: 1, ...messageData, createdAt: new Date() }
      const mockInsert = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockMessage]),
      }

      mockedDb.insert.mockReturnValue(mockInsert as any)

      const result = await DealRepository.addMessage(1, 2, 'Test message')

      expect(mockedDb.insert).toHaveBeenCalledWith(dealMessages)
      expect(mockInsert.values).toHaveBeenCalledWith(messageData)
      expect(result).toEqual(mockMessage)
    })
  })

  describe('getDealMessages', () => {
    it('should return messages for a deal in chronological order', async () => {
      const mockMessages = [
        { id: 1, dealId: 1, userId: 2, message: 'Hello', createdAt: new Date() },
        { id: 2, dealId: 1, userId: 3, message: 'Hi there', createdAt: new Date() },
      ]

      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockMessages),
      }

      mockedDb.select.mockReturnValue(mockSelect as any)
      mockedEq.mockReturnValue({} as any)
      mockedAsc.mockReturnValue({} as any)

      const result = await DealRepository.getDealMessages(1)

      expect(mockedDb.select).toHaveBeenCalled()
      expect(mockSelect.from).toHaveBeenCalledWith(dealMessages)
      expect(mockSelect.where).toHaveBeenCalledWith({})
      expect(mockedEq).toHaveBeenCalledWith(dealMessages.dealId, 1)
      expect(mockSelect.orderBy).toHaveBeenCalledWith({})
      expect(mockedAsc).toHaveBeenCalledWith(dealMessages.createdAt)
      expect(result).toEqual(mockMessages)
    })
  })
})
