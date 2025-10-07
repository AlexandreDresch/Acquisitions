/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express'
import { DealController } from '../../src/controllers/deal.controller'
import { DealService } from '../../src/services/deal.service'
import {
  createListingSchema,
  updateListingSchema,
  createDealSchema,
  updateDealSchema,
  dealMessageSchema,
} from '../../src/schemas/deal.validation'
import { formatValidationError } from '../../src/utils/format'

jest.mock('../../src/services/deal.service')
jest.mock('../../src/schemas/deal.validation')
jest.mock('../../src/utils/format')

const mockedDealService = DealService as jest.Mocked<typeof DealService>
const mockedCreateListingSchema = createListingSchema as jest.Mocked<typeof createListingSchema>
const mockedUpdateListingSchema = updateListingSchema as jest.Mocked<typeof updateListingSchema>
const mockedCreateDealSchema = createDealSchema as jest.Mocked<typeof createDealSchema>
const mockedUpdateDealSchema = updateDealSchema as jest.Mocked<typeof updateDealSchema>
const mockedDealMessageSchema = dealMessageSchema as jest.Mocked<typeof dealMessageSchema>
const mockedFormatValidationError = formatValidationError as jest.MockedFunction<
  typeof formatValidationError
>

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
  userId: 1,
  message: 'Test message',
  createdAt: new Date(),
  ...overrides,
})

describe('DealController Integration Tests', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    jest.clearAllMocks()

    mockRequest = {
      user: { id: 1, email: 'user@example.com', role: 'user' },
      params: {},
      body: {},
      query: {},
    }

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }

    mockNext = jest.fn()
  })

  describe('createListing', () => {
    it('should create listing successfully with valid data', async () => {
      const listingData = {
        title: 'Test Listing',
        description: 'Test Description',
        price: '100.00',
        category: 'electronics',
      }
      mockRequest.body = listingData

      const mockListing = createMockListing(listingData)
      const mockValidationResult = { success: true, data: listingData }
      mockedCreateListingSchema.safeParse.mockReturnValue(mockValidationResult as any)
      mockedDealService.createListing.mockResolvedValue(mockListing)

      await DealController.createListing(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockedCreateListingSchema.safeParse).toHaveBeenCalledWith(listingData)
      expect(mockedDealService.createListing).toHaveBeenCalledWith({
        ...listingData,
        sellerId: 1,
      })
      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Listing created successfully',
        data: mockListing,
      })
    })

    it('should return 400 when validation fails', async () => {
      const invalidData = { title: '' }
      mockRequest.body = invalidData

      const mockError = new Error('Validation error')
      const mockValidationResult = {
        success: false,
        error: mockError,
      }
      const formattedErrors = [{ field: 'invalid', message: 'Invalid field' }]

      mockedCreateListingSchema.safeParse.mockReturnValue(mockValidationResult as any)
      mockedFormatValidationError.mockReturnValue(formattedErrors)

      await DealController.createListing(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors,
      })
      expect(mockedDealService.createListing).not.toHaveBeenCalled()
    })

    it('should call next when service throws error', async () => {
      const listingData = {
        title: 'Test Listing',
        price: '100.00',
        category: 'electronics',
      }
      mockRequest.body = listingData

      const mockValidationResult = { success: true, data: listingData }
      const serviceError = new Error('Service error')

      mockedCreateListingSchema.safeParse.mockReturnValue(mockValidationResult as any)
      mockedDealService.createListing.mockRejectedValue(serviceError)

      await DealController.createListing(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(serviceError)
    })
  })

  describe('getListing', () => {
    it('should get listing successfully', async () => {
      mockRequest.params = { id: '1' }
      const mockListing = createMockListing()
      mockedDealService.getListing.mockResolvedValue(mockListing)

      await DealController.getListing(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockedDealService.getListing).toHaveBeenCalledWith(1)
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Listing retrieved successfully',
        data: mockListing,
      })
    })

    it('should handle non-numeric ID', async () => {
      mockRequest.params = { id: 'invalid' }
      const serviceError = new Error('Listing not found')
      mockedDealService.getListing.mockRejectedValue(serviceError)

      await DealController.getListing(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockedDealService.getListing).toHaveBeenCalledWith(NaN)
      expect(mockNext).toHaveBeenCalledWith(serviceError)
    })
  })

  describe('getUserListings', () => {
    it('should get user listings successfully', async () => {
      const mockListings = [
        createMockListing({ id: 1, title: 'Listing 1' }),
        createMockListing({ id: 2, title: 'Listing 2' }),
      ]
      mockedDealService.getUserListings.mockResolvedValue(mockListings)

      await DealController.getUserListings(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockedDealService.getUserListings).toHaveBeenCalledWith(1)
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User listings retrieved successfully',
        data: mockListings,
        count: 2,
      })
    })
  })

  describe('getAllListings', () => {
    it('should get all listings with filters', async () => {
      mockRequest.query = {
        category: 'electronics',
        minPrice: '100',
        maxPrice: '500',
        status: 'active',
      }
      const mockListings = [
        createMockListing({ id: 1, title: 'Listing 1', category: 'electronics', price: '200.00' }),
      ]
      mockedDealService.getAllListings.mockResolvedValue(mockListings)

      await DealController.getAllListings(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockedDealService.getAllListings).toHaveBeenCalledWith({
        category: 'electronics',
        minPrice: '100',
        maxPrice: '500',
        status: 'active',
      })
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Listings retrieved successfully',
        data: mockListings,
        count: 1,
      })
    })

    it('should get all listings without filters', async () => {
      mockRequest.query = {}
      const mockListings = [
        createMockListing({ id: 1, title: 'Listing 1' }),
        createMockListing({ id: 2, title: 'Listing 2' }),
      ]
      mockedDealService.getAllListings.mockResolvedValue(mockListings)

      await DealController.getAllListings(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockedDealService.getAllListings).toHaveBeenCalledWith({})
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Listings retrieved successfully',
        data: mockListings,
        count: 2,
      })
    })
  })

  describe('updateListing', () => {
    it('should update listing successfully', async () => {
      mockRequest.params = { id: '1' }
      const updateData = { title: 'Updated Title', price: '150.00' }
      mockRequest.body = updateData

      const mockUpdatedListing = createMockListing(updateData)
      const mockValidationResult = { success: true, data: updateData }

      mockedUpdateListingSchema.safeParse.mockReturnValue(mockValidationResult as any)
      mockedDealService.updateListing.mockResolvedValue(mockUpdatedListing)

      await DealController.updateListing(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockedUpdateListingSchema.safeParse).toHaveBeenCalledWith(updateData)
      expect(mockedDealService.updateListing).toHaveBeenCalledWith(1, updateData, 1)
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Listing updated successfully',
        data: mockUpdatedListing,
      })
    })

    it('should return 400 when validation fails', async () => {
      mockRequest.params = { id: '1' }
      const invalidData = { price: 'invalid' }
      mockRequest.body = invalidData

      const mockValidationResult = {
        success: false,
        error: new Error('Validation error'),
      }
      const formattedErrors = [{ field: 'price', message: 'Invalid format' }]

      mockedUpdateListingSchema.safeParse.mockReturnValue(mockValidationResult as any)
      mockedFormatValidationError.mockReturnValue(formattedErrors)

      await DealController.updateListing(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors,
      })
      expect(mockedDealService.updateListing).not.toHaveBeenCalled()
    })
  })

  describe('deleteListing', () => {
    it('should delete listing successfully', async () => {
      mockRequest.params = { id: '1' }
      mockedDealService.deleteListing.mockResolvedValue(undefined as any)

      await DealController.deleteListing(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockedDealService.deleteListing).toHaveBeenCalledWith(1, 1)
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Listing deleted successfully',
      })
    })
  })

  describe('createDeal', () => {
    it('should create deal successfully', async () => {
      const dealData = {
        listingId: 1,
        offerAmount: '90.00',
        message: 'Test offer',
      }
      mockRequest.body = dealData

      const mockDeal = createMockDeal(dealData)
      const mockValidationResult = { success: true, data: dealData }

      mockedCreateDealSchema.safeParse.mockReturnValue(mockValidationResult as any)
      mockedDealService.createDeal.mockResolvedValue(mockDeal)

      await DealController.createDeal(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockedCreateDealSchema.safeParse).toHaveBeenCalledWith(dealData)
      expect(mockedDealService.createDeal).toHaveBeenCalledWith({
        ...dealData,
        buyerId: 1,
      })
      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Deal created successfully',
        data: mockDeal,
      })
    })
  })

  describe('getDeal', () => {
    it('should get deal successfully', async () => {
      mockRequest.params = { id: '1' }
      const mockResult = {
        deal: createMockDeal(),
        listing: createMockListing(),
      }
      mockedDealService.getDeal.mockResolvedValue(mockResult)

      await DealController.getDeal(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockedDealService.getDeal).toHaveBeenCalledWith(1, 1)
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Deal retrieved successfully',
        data: mockResult,
      })
    })
  })

  describe('getUserDeals', () => {
    it('should get user deals as buyer by default', async () => {
      const mockDeals = [createMockDeal({ id: 1, buyerId: 1 })]
      mockedDealService.getUserDeals.mockResolvedValue(mockDeals)

      await DealController.getUserDeals(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockedDealService.getUserDeals).toHaveBeenCalledWith(1, 'buyer')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User deals retrieved successfully',
        data: mockDeals,
        count: 1,
      })
    })

    it('should get user deals as seller when specified', async () => {
      mockRequest.query = { role: 'seller' }
      const mockDeals = [createMockDeal({ id: 1, buyerId: 2 })]
      mockedDealService.getUserDeals.mockResolvedValue(mockDeals)

      await DealController.getUserDeals(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockedDealService.getUserDeals).toHaveBeenCalledWith(1, 'seller')
    })
  })

  describe('updateDeal', () => {
    it('should update deal successfully', async () => {
      mockRequest.params = { id: '1' }
      const updateData = { status: 'accepted' }
      mockRequest.body = updateData

      const mockUpdatedDeal = createMockDeal(updateData)
      const mockValidationResult = { success: true, data: updateData }

      mockedUpdateDealSchema.safeParse.mockReturnValue(mockValidationResult as any)
      mockedDealService.updateDeal.mockResolvedValue(mockUpdatedDeal)

      await DealController.updateDeal(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockedUpdateDealSchema.safeParse).toHaveBeenCalledWith(updateData)
      expect(mockedDealService.updateDeal).toHaveBeenCalledWith(1, updateData, 1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Deal updated successfully',
        data: mockUpdatedDeal,
      })
    })
  })

  describe('acceptDeal', () => {
    it('should accept deal successfully', async () => {
      mockRequest.params = { id: '1' }
      const mockAcceptedDeal = createMockDeal({ status: 'accepted' })
      mockedDealService.acceptDeal.mockResolvedValue(mockAcceptedDeal)

      await DealController.acceptDeal(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockedDealService.acceptDeal).toHaveBeenCalledWith(1, 1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Deal accepted successfully',
        data: mockAcceptedDeal,
      })
    })
  })

  describe('completeDeal', () => {
    it('should complete deal successfully', async () => {
      mockRequest.params = { id: '1' }
      const mockCompletedDeal = createMockDeal({ status: 'completed', completedAt: new Date() })
      mockedDealService.completeDeal.mockResolvedValue(mockCompletedDeal)

      await DealController.completeDeal(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockedDealService.completeDeal).toHaveBeenCalledWith(1, 1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Deal completed successfully',
        data: mockCompletedDeal,
      })
    })
  })

  describe('addMessage', () => {
    it('should add message successfully', async () => {
      mockRequest.params = { id: '1' }
      const messageData = { message: 'Hello, is this available?' }
      mockRequest.body = messageData

      const mockMessage = createMockMessage(messageData)
      const mockValidationResult = { success: true, data: messageData }

      mockedDealMessageSchema.safeParse.mockReturnValue(mockValidationResult as any)
      mockedDealService.addMessage.mockResolvedValue(mockMessage)

      await DealController.addMessage(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockedDealMessageSchema.safeParse).toHaveBeenCalledWith(messageData)
      expect(mockedDealService.addMessage).toHaveBeenCalledWith(1, 1, messageData)
      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Message added successfully',
        data: mockMessage,
      })
    })
  })

  describe('getDealMessages', () => {
    it('should get deal messages successfully', async () => {
      mockRequest.params = { id: '1' }
      const mockMessages = [
        createMockMessage({ id: 1, userId: 1, message: 'Hello' }),
        createMockMessage({ id: 2, userId: 2, message: 'Hi there' }),
      ]
      mockedDealService.getDealMessages.mockResolvedValue(mockMessages)

      await DealController.getDealMessages(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockedDealService.getDealMessages).toHaveBeenCalledWith(1, 1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Deal messages retrieved successfully',
        data: mockMessages,
        count: 2,
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors by calling next', async () => {
      mockRequest.params = { id: '1' }
      const serviceError = new Error('Service unavailable')
      mockedDealService.getListing.mockRejectedValue(serviceError)

      await DealController.getListing(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(serviceError)
    })

    it('should handle validation errors without calling next', async () => {
      mockRequest.body = { invalid: 'data' }
      const mockValidationResult = {
        success: false,
        error: new Error('Validation failed'),
      }

      const formattedErrors = [
        { field: 'title', message: 'Required' },
        { field: 'price', message: 'Must be a valid number' },
      ]

      mockedCreateListingSchema.safeParse.mockReturnValue(mockValidationResult as any)
      mockedFormatValidationError.mockReturnValue(formattedErrors)

      await DealController.createListing(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })
  })
})
