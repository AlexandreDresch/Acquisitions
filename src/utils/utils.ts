export function validateRequiredFields(fields: Record<string, string>): Record<string, string> {
  const trimmedFields: Record<string, string> = {}

  for (const [key, value] of Object.entries(fields)) {
    const trimmed = value.trim()
    if (!trimmed) {
      throw new Error(`Field ${key} is required!`)
    }
    trimmedFields[key] = trimmed
  }

  return trimmedFields
}
