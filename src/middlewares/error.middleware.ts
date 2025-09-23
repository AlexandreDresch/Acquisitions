/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Response, Request, NextFunction } from 'express'

interface CustomError extends Error {
  statusCode?: number
  code?: number
  keyValue?: Record<string, any>
  path?: string
  errors?: Record<string, { message: string }>
}

const errorMiddleware = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    let error: CustomError = { ...err }

    error.message = err.message

    console.error(err)

    if (err.name === 'CastError') {
      const message = `Resource not found. Invalid: ${err.path}`
      error = new Error(message) as CustomError
      error.statusCode = 404
    }

    if (err.code === 11000) {
      const message = `Duplicate field value entered: ${Object.keys(err.keyValue!)[0]}`
      error = new Error(message) as CustomError
      error.statusCode = 400
    }

    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors!)
        .map((val: any) => val.message)
        .join(', ')
      error = new Error(message) as CustomError
      error.statusCode = 400
    }

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Server Error',
    })
  } catch (error) {
    next(error)
  }
}

export default errorMiddleware
