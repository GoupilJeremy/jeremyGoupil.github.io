/**
 * Loads and merges all event JSON files.
 * Returns a sorted array of events (oldest first).
 */
export async function loadEvents() {
  const files = [
    './src/data/events/cosmos.json',
  ]

  const results = await Promise.all(
    files.map(f => fetch(f).then(r => r.json()))
  )

  const all = results.flat()

  // Sort by absolute year value (most negative = oldest)
  all.sort((a, b) => a.date.year - b.date.year)

  return all
}

/**
 * Formats a raw year number into a human-readable era label.
 */
export function formatDate(year) {
  const abs = Math.abs(year)
  if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(1)} Ga`
  if (abs >= 1_000_000)     return `${(abs / 1_000_000).toFixed(0)} Ma`
  if (abs >= 1_000)         return `${(abs / 1_000).toFixed(0)} Ka`
  if (year < 0)             return `${abs} av. J.-C.`
  return `${year} ap. J.-C.`
}

/**
 * Returns normalized progress (0–1) for a year within the full timeline.
 * Uses a logarithmic scale for cosmic + geological time.
 */
export function yearToProgress(year, minYear = -13_800_000_000, maxYear = 2024) {
  const logMin = Math.log10(Math.abs(minYear))
  const logMax = 0

  if (year <= 0) {
    const logYear = year === 0 ? 0 : Math.log10(Math.abs(year))
    return 1 - (logYear - logMax) / (logMin - logMax)
  }
  return 1
}
