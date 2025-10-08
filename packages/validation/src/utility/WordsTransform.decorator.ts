/**
 * Transforms a string to lowercase. Used internally by TextField.
 * @param value The input string.
 * @returns The lowercase string.
 */
export function LowwerWords(value: string): string {
  if (!value || typeof value !== 'string') return value;

  return value.toLowerCase();
}

/**
 * Capitalizes the first letter of every word in a string. Used internally by CapitalField.
 * @param value The input string.
 * @returns The string with capitalized words.
 */
export function CapitalizeWords(value: string): string {
  if (!value || typeof value !== 'string') return value;

  return value
    .toLowerCase()
    .split(' ')
    .map((word) =>
      word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : '',
    )
    .join(' ');
}