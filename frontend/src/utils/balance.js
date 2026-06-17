/**
 * Pricing thresholds (matches backend payments.py FULL_THRESHOLD).
 * Convention early bird = $280, standard = $300.
 * Boat cruise = $220.
 */
const FULL_THRESHOLD = { convention: 280, boat_cruise: 220 }
const STANDARD_PRICE = { convention: 300, boat_cruise: 220 }

/**
 * Returns balance due per product type for a registrant.
 * Only considers products the registrant is actually registered for.
 *
 * @param {Object} registrant - RegistrantOut shape with payments array
 * @returns {{ convention: number, boat_cruise: number, total: number }}
 */
export function getBalanceDue(registrant) {
  if (registrant?.is_vip) return { convention: 0, boat_cruise: 0, total: 0 }

  const payments = registrant?.payments ?? []

  const paid = { convention: 0, boat_cruise: 0 }
  for (const p of payments) {
    if (p.product_type === 'convention') paid.convention += parseFloat(p.amount) || 0
    if (p.product_type === 'boat_cruise') paid.boat_cruise += parseFloat(p.amount) || 0
  }

  const balance = (type) => {
    if (!registrant[type]) return 0          // not registered for this event
    if (paid[type] >= FULL_THRESHOLD[type]) return 0
    return Math.max(0, STANDARD_PRICE[type] - paid[type])
  }

  const convention = balance('convention')
  const boat_cruise = balance('boat_cruise')

  return { convention, boat_cruise, total: convention + boat_cruise }
}
