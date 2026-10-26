/** Normalizes line endings and non-breaking spaces introduced by Word. */
export function normalizePastedText(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u2028\u2029]/g, "\n")
    .replace(/\u00a0/g, " ")
    .trim();
}

/** Makes legacy Word content readable when line breaks were stored as text. */
export function formatReadingText(value: string) {
  return value
    .replace(/\\r?\\n/g, "\n")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u2028\u2029]/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|h[1-6])>\s*<(?:p|div|li|h[1-6])[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\s*•\s*/g, "\n• ")
    .replace(/([.!?])\s+(?=\d{1,2}\.\s+[A-ZÁÉÍÓÚÑ])/g, "$1\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
