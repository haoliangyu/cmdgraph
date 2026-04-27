export function extractVersionFromText(text: string): string | undefined {
  if (!text.trim()) {
    return undefined
  }

  const match = text.match(/\bv?\d+\.\d+(?:\.\d+)?(?:[-+][0-9A-Za-z.-]+)?\b/)
  return match?.[0]
}