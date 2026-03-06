import cosmos      from './events/cosmos.json'
import prehistoric from './events/prehistoric.json'
import antiquity   from './events/antiquity.json'
import medieval    from './events/medieval.json'
import modern      from './events/modern.json'
import digital     from './events/digital.json'

/**
 * Returns all events sorted oldest-first.
 * JSON files are bundled at build time (Vite handles JSON imports).
 */
export async function loadEvents() {
  const all = [
    ...cosmos,
    ...prehistoric,
    ...antiquity,
    ...medieval,
    ...modern,
    ...digital,
  ]

  all.sort((a, b) => a.date.year - b.date.year)

  return all
}

// ── Logarithmic time scale ──────────────────────────────────────────────────
// Maps any year to a normalized t ∈ [0, 1] using log10(distance from present).
// Big Bang (-13.8 Ga) → t=0 ; Present (2024) → t=1.
// This gives the human era (last ~10 000 years) ~40% of the spiral length.

const PRESENT_YEAR = 2024
const MAX_DISTANCE = PRESENT_YEAR - (-13_800_000_000) // 13_800_002_024
const LOG_MAX = Math.log10(MAX_DISTANCE)               // ≈ 10.14

export function yearToT(year) {
  const distance = PRESENT_YEAR - year
  if (distance <= 0) return 1
  return 1 - Math.log10(distance + 1) / LOG_MAX
}

/**
 * Formats a raw year number into a human-readable era label.
 */
export function formatDate(year) {
  const abs = Math.abs(year)
  if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(1)} Ga`
  if (abs >= 1_000_000)     return `${(abs / 1_000_000).toFixed(0)} Ma`
  if (abs >= 10_000)        return `${(abs / 1_000).toFixed(0)} Ka`
  if (year < 0)             return `${abs.toLocaleString('fr')} av. J.-C.`
  return `${year} ap. J.-C.`
}
