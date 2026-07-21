/**
 * Pricing thresholds (matches backend payments.py / admin Registrants).
 * Convention early bird = $280, standard = $300, child/youth = $150.
 * Boat cruise = $220.
 * Vendor table = $500.
 */
const FULL_THRESHOLD = { convention: 280, boat_cruise: 220, vendor: 500 }
const STANDARD_PRICE = { convention: 300, boat_cruise: 220, vendor: 500 }
const CHILD_YOUTH_CONVENTION_PRICE = 150

/**
 * Returns balance due per product type for a registrant.
 * Only considers products the registrant is actually registered for.
 *
 * @param {Object} registrant - RegistrantOut shape with payments array
 * @returns {{ convention: number, boat_cruise: number, vendor: number, total: number }}
 */
export function getBalanceDue(registrant) {
  if (registrant?.is_vip) return { convention: 0, boat_cruise: 0, vendor: 0, total: 0 }

  const payments = registrant?.payments ?? []

  const paid = { convention: 0, boat_cruise: 0, vendor: 0 }
  for (const p of payments) {
    if (p.product_type === 'convention') paid.convention += parseFloat(p.amount) || 0
    if (p.product_type === 'boat_cruise') paid.boat_cruise += parseFloat(p.amount) || 0
    if (p.product_type === 'vendor') paid.vendor += parseFloat(p.amount) || 0
  }

  const isChildOrYouth = registrant?.age_group === 'child' || registrant?.age_group === 'youth'

  const balance = (type) => {
    if (!registrant[type]) return 0          // not registered for this event
    if (type === 'convention' && isChildOrYouth) {
      if (paid.convention >= CHILD_YOUTH_CONVENTION_PRICE) return 0
      return Math.max(0, CHILD_YOUTH_CONVENTION_PRICE - paid.convention)
    }
    if (paid[type] >= FULL_THRESHOLD[type]) return 0
    return Math.max(0, STANDARD_PRICE[type] - paid[type])
  }

  const convention = balance('convention')
  const boat_cruise = balance('boat_cruise')
  const vendor = balance('vendor')

  return { convention, boat_cruise, vendor, total: convention + boat_cruise + vendor }
}
