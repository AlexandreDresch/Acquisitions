import type { Request, Response, NextFunction } from 'express'
import { DealService } from '../services/deal.service.ts'
import {
  createListingSchema,
  updateListingSchema,
  createDealSchema,
  updateDealSchema,
  dealMessageSchema,
} from '../schemas/deal.validation.ts'
import { formatValidationError } from '../utils/format.ts'

export const DealController = {
  async createListing(req: Request, res: Response, next: NextFunction) {
    try {
      const validationResult = createListingSchema.safeParse(req.body)
      if (!validationResult.success) {
        const errors = formatValidationError(validationResult.error)
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        })
      }

      const listing = await DealService.createListing({
        ...validationResult.data,
        sellerId: req.user!.id,
      })

      res.status(201).json({
        success: true,
        message: 'Listing created successfully',
        data: listing,
      })
    } catch (error) {
      next(error)
    }
  },

  async getListing(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const listing = await DealService.getListing(parseInt(id))

      res.status(200).json({
        success: true,
        message: 'Listing retrieved successfully',
        data: listing,
      })
    } catch (error) {
      next(error)
    }
  },

  async getUserListings(req: Request, res: Response, next: NextFunction) {
    try {
      const listings = await DealService.getUserListings(req.user!.id)

      res.status(200).json({
        success: true,
        message: 'User listings retrieved successfully',
        data: listings,
        count: listings.length,
      })
    } catch (error) {
      next(error)
    }
  },

  async getAllListings(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, minPrice, maxPrice, status } = req.query
      const filters = {
        category: category as string,
        minPrice: minPrice as string,
        maxPrice: maxPrice as string,
        status: status as string,
      }

      const listings = await DealService.getAllListings(filters)

      res.status(200).json({
        success: true,
        message: 'Listings retrieved successfully',
        data: listings,
        count: listings.length,
      })
    } catch (error) {
      next(error)
    }
  },

  async updateListing(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const validationResult = updateListingSchema.safeParse(req.body)
      if (!validationResult.success) {
        const errors = formatValidationError(validationResult.error)
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        })
      }

      const listing = await DealService.updateListing(
        parseInt(id),
        validationResult.data,
        req.user!.id
      )

      res.status(200).json({
        success: true,
        message: 'Listing updated successfully',
        data: listing,
      })
    } catch (error) {
      next(error)
    }
  },

  async deleteListing(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await DealService.deleteListing(parseInt(id), req.user!.id)

      res.status(200).json({
        success: true,
        message: 'Listing deleted successfully',
      })
    } catch (error) {
      next(error)
    }
  },

  // Deal controllers
  async createDeal(req: Request, res: Response, next: NextFunction) {
    try {
      const validationResult = createDealSchema.safeParse(req.body)
      if (!validationResult.success) {
        const errors = formatValidationError(validationResult.error)
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        })
      }

      const deal = await DealService.createDeal({
        ...validationResult.data,
        buyerId: req.user!.id,
      })

      res.status(201).json({
        success: true,
        message: 'Deal created successfully',
        data: deal,
      })
    } catch (error) {
      next(error)
    }
  },

  async getDeal(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const result = await DealService.getDeal(parseInt(id), req.user!.id)

      res.status(200).json({
        success: true,
        message: 'Deal retrieved successfully',
        data: result,
      })
    } catch (error) {
      next(error)
    }
  },

  async getUserDeals(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.query
      const deals = await DealService.getUserDeals(
        req.user!.id,
        (role as 'buyer' | 'seller') || 'buyer'
      )

      res.status(200).json({
        success: true,
        message: 'User deals retrieved successfully',
        data: deals,
        count: deals.length,
      })
    } catch (error) {
      next(error)
    }
  },

  async updateDeal(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const validationResult = updateDealSchema.safeParse(req.body)
      if (!validationResult.success) {
        const errors = formatValidationError(validationResult.error)
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        })
      }

      const deal = await DealService.updateDeal(parseInt(id), validationResult.data, req.user!.id)

      res.status(200).json({
        success: true,
        message: 'Deal updated successfully',
        data: deal,
      })
    } catch (error) {
      next(error)
    }
  },

  async acceptDeal(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const deal = await DealService.acceptDeal(parseInt(id), req.user!.id)

      res.status(200).json({
        success: true,
        message: 'Deal accepted successfully',
        data: deal,
      })
    } catch (error) {
      next(error)
    }
  },

  async completeDeal(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const deal = await DealService.completeDeal(parseInt(id), req.user!.id)

      res.status(200).json({
        success: true,
        message: 'Deal completed successfully',
        data: deal,
      })
    } catch (error) {
      next(error)
    }
  },

  // Deal Messages
  async addMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const validationResult = dealMessageSchema.safeParse(req.body)
      if (!validationResult.success) {
        const errors = formatValidationError(validationResult.error)
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        })
      }

      const message = await DealService.addMessage(
        parseInt(id),
        req.user!.id,
        validationResult.data
      )

      res.status(201).json({
        success: true,
        message: 'Message added successfully',
        data: message,
      })
    } catch (error) {
      next(error)
    }
  },

  async getDealMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const messages = await DealService.getDealMessages(parseInt(id), req.user!.id)

      res.status(200).json({
        success: true,
        message: 'Deal messages retrieved successfully',
        data: messages,
        count: messages.length,
      })
    } catch (error) {
      next(error)
    }
  },
}
