/**
 * Time scale utilities for mapping years to timeline positions.
 *
 * The challenge: representing -4,500,000,000 to 2026 on a single axis.
 * Solution: logarithmic scale that compresses deep time and expands recent history.
 */

const EARLIEST_YEAR = -4_500_000_000;
const LATEST_YEAR = 2026;

/**
 * Convert a year to a normalized position [0, 1] on the timeline using log scale.
 */
export function yearToPosition(year: number): number {
  const offset = Math.abs(EARLIEST_YEAR) + 1;
  const shifted = year + offset;
  const min = EARLIEST_YEAR + offset;
  const max = LATEST_YEAR + offset;
  return (Math.log10(shifted) - Math.log10(min)) / (Math.log10(max) - Math.log10(min));
}

/**
 * Convert a normalized position [0, 1] back to a year.
 */
export function positionToYear(position: number): number {
  const offset = Math.abs(EARLIEST_YEAR) + 1;
  const min = EARLIEST_YEAR + offset;
  const max = LATEST_YEAR + offset;
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const logValue = logMin + position * (logMax - logMin);
  return Math.pow(10, logValue) - offset;
}

/**
 * Format a year for display.
 * e.g. -4500000000 → "4,5 Ga", -540000000 → "540 Ma", -10000 → "10 000 av. J.-C.", 1687 → "1687"
 */
export function formatYear(year: number): string {
  const abs = Math.abs(year);

  if (abs >= 1_000_000_000) {
    return `${(abs / 1_000_000_000).toFixed(1).replace(".", ",")} Ga`;
  }
  if (abs >= 1_000_000) {
    return `${Math.round(abs / 1_000_000)} Ma`;
  }
  if (year < 0) {
    return `${abs.toLocaleString("fr-FR")} av. J.-C.`;
  }
  return year.toLocaleString("fr-FR");
}

export { EARLIEST_YEAR, LATEST_YEAR };
