/** Normalizes line endings and non-breaking spaces introduced by Word. */
export function normalizePastedText(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u2028\u2029]/g, "\n")
    .replace(/\u00a0/g, " ")
    .trim();
}
