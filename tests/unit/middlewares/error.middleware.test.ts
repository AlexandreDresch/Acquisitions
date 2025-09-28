/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express'
import errorMiddleware from '../../../src/middlewares/error.middleware.ts'

import { jest } from '@jest/globals'

describe('errorMiddleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  const mockStatus = jest.fn() as unknown as jest.MockedFunction<(code: number) => Response>
  const mockJson = jest.fn() as unknown as jest.MockedFunction<(body?: any) => Response>

  beforeEach(() => {
    req = {}

    mockStatus.mockClear()
    mockJson.mockClear()

    mockStatus.mockReturnValue({
      json: mockJson,
    } as unknown as Response)

    res = {
      status: mockStatus,
      json: mockJson,
    }

    next = jest.fn()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should handle generic errors', () => {
    const err = new Error('Something went wrong')
    errorMiddleware(err as any, req as Request, res as Response, next)

    expect(mockStatus).toHaveBeenCalledWith(500)
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: 'Something went wrong',
    })
  })

  it('should handle CastError', () => {
    const err = { name: 'CastError', path: 'id', message: 'Invalid cast' }
    errorMiddleware(err as any, req as Request, res as Response, next)

    expect(mockStatus).toHaveBeenCalledWith(404)
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: 'Resource not found. Invalid: id',
    })
  })

  it('should handle duplicate key error', () => {
    const err = { code: 11000, keyValue: { email: 'test@test.com' }, message: 'Duplicate' }
    errorMiddleware(err as any, req as Request, res as Response, next)

    expect(mockStatus).toHaveBeenCalledWith(400)
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: 'Duplicate field value entered: email',
    })
  })

  it('should handle ValidationError', () => {
    const err = {
      name: 'ValidationError',
      errors: {
        name: { message: 'Name is required' },
        email: { message: 'Email invalid' },
      },
    }
    errorMiddleware(err as any, req as Request, res as Response, next)

    expect(mockStatus).toHaveBeenCalledWith(400)
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: 'Name is required, Email invalid',
    })
  })

  it('should use default status code for unknown errors', () => {
    const err = new Error('Unknown error') as any
    err.statusCode = undefined

    errorMiddleware(err, req as Request, res as Response, next)

    expect(mockStatus).toHaveBeenCalledWith(500)
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: 'Unknown error',
    })
  })
})
