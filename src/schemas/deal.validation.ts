import { z } from 'zod'

const errorMessages = {
  required: (field: string) => `${field} is required`,
  maxLength: (field: string, max: number) => `${field} must be less than ${max} characters`,
  minLength: (field: string, min: number) => `${field} must be at least ${min} characters`,
  invalidNumber: (field: string) => `${field} must be a valid number with up to 2 decimal places`,
  positiveNumber: (field: string) => `${field} must be greater than 0`,
  futureDate: (field: string) => `${field} must be in the future`,
  validObject: (field: string) => `${field} must be a valid object`,
}

export const createListingSchema = z.object({
  title: z
    .string()
    .min(1, errorMessages.required('Title'))
    .max(255, errorMessages.maxLength('Title', 255)),
  description: z.string().max(2000, errorMessages.maxLength('Description', 2000)).optional(),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, errorMessages.invalidNumber('Price'))
    .refine((val) => parseFloat(val) > 0, errorMessages.positiveNumber('Price')),
  category: z
    .string()
    .min(1, errorMessages.required('Category'))
    .max(100, errorMessages.maxLength('Category', 100)),
})

export const updateListingSchema = createListingSchema.partial()

export const createDealSchema = z.object({
  listingId: z
    .number()
    .int('Listing ID must be an integer')
    .positive(errorMessages.positiveNumber('Listing ID')),
  offerAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, errorMessages.invalidNumber('Offer amount'))
    .refine((val) => parseFloat(val) > 0, errorMessages.positiveNumber('Offer amount')),
  message: z.string().max(500, errorMessages.maxLength('Message', 500)).optional(),
  terms: z
    .record(z.string(), z.any())
    .refine(
      (val) => val === undefined || (typeof val === 'object' && val !== null),
      errorMessages.validObject('Terms')
    )
    .optional(),
  expiresAt: z
    .string()
    .refine((val) => {
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/
      if (!isoRegex.test(val)) {
        return false
      }
      const date = new Date(val)
      return !isNaN(date.getTime()) && date > new Date()
    }, 'Expiration date must be a valid ISO 8601 datetime string in the future')
    .optional(),
})

export const updateDealSchema = z.object({
  status: z
    .enum(['pending', 'accepted', 'rejected', 'completed', 'cancelled'], {
      message: 'Status must be one of: pending, accepted, rejected, completed, cancelled',
    })
    .optional(),
  message: z.string().max(500, errorMessages.maxLength('Message', 500)).optional(),
})

export const dealMessageSchema = z.object({
  message: z
    .string()
    .min(1, errorMessages.required('Message'))
    .max(1000, errorMessages.maxLength('Message', 1000)),
})

export type CreateListingInput = z.infer<typeof createListingSchema>
export type UpdateListingInput = z.infer<typeof updateListingSchema>
export type CreateDealInput = z.infer<typeof createDealSchema>
export type UpdateDealInput = z.infer<typeof updateDealSchema>
export type DealMessageInput = z.infer<typeof dealMessageSchema>
