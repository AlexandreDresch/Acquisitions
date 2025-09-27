import { z, ZodError } from 'zod'
import { formatValidationError } from '../../../src/utils/format.ts'

describe('formatValidationError', () => {
  it('should format a ZodError with issues correctly', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    })

    try {
      schema.parse({ name: 123, age: 'not-a-number' })
    } catch (err) {
      const formatted = formatValidationError(err as ZodError)

      expect(formatted).toEqual([{ field: 'name' }, { field: 'age' }])
    }
  })

  it('should return default message if error has no issues', () => {
    const fakeError = { issues: null } as unknown as ZodError

    const formatted = formatValidationError(fakeError)

    expect(formatted).toBe('Validation error formatting failed')
  })

  it('should return JSON string if issues array is empty', () => {
    const fakeError = { issues: [] } as unknown as ZodError

    const formatted = formatValidationError(fakeError)

    expect(formatted).toBe(JSON.stringify(fakeError))
  })
})
