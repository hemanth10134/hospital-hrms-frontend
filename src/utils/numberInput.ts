/**
 * Strips redundant leading zeros from a numeric input string (e.g. "0123" -> "123"),
 * while leaving decimals like "0.5" untouched. Needed because some browsers (Safari)
 * don't resync a controlled <input type="number"> back to its DOM value when the
 * parsed numeric value is unchanged, so typing "1" after an existing "0" displays "01".
 */
export function sanitizeLeadingZero(value: string): string {
  return value.replace(/^0+(?=\d)/, '')
}

/**
 * Handles a numeric <input>'s onChange: sanitizes leading zeros (imperatively forcing
 * the DOM value when needed) and returns the parsed number for the caller's state update.
 */
export function parseNumericInput(event: React.ChangeEvent<HTMLInputElement>): number {
  const sanitized = sanitizeLeadingZero(event.target.value)
  if (sanitized !== event.target.value) {
    event.target.value = sanitized
  }
  return Number(sanitized)
}
