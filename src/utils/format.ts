import { ZodError } from 'zod'

export const formatValidationError = (error: ZodError) => {
  if (!error || !error.issues) return 'Validation error formatting failed'

  if (error.issues.length > 0) {
    return error.issues.map((issue) => ({
      field: issue.path.map(String).join('.'),
    }))
  }

  return JSON.stringify(error)
}
