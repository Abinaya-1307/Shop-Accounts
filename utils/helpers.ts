// ============================================================
// SHOPTRACKER UTILITY HELPERS
// ============================================================

/**
 * formatCurrency
 * Returns an Indian-formatted Rupee string.
 * e.g.: 1200 → "₹ 1,200.00"
 */
export function formatCurrency(amount: number): string {
  return `₹ ${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * formatDate
 * Converts an ISO date string to a human-readable format.
 * e.g.: "2026-02-21T10:30:00.000Z" → "Feb 21, 2026"
 */
export function formatDate(isoString: string): string {
  if (!isoString) return '';
  try {
    return new Date(isoString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/**
 * calculatePercentageChange
 * Returns an integer percentage change from oldVal to newVal.
 * e.g.: (1000, 1200) → 20   (1000, 800) → -20
 */
export function calculatePercentageChange(oldVal: number, newVal: number): number {
  if (oldVal === 0) return 0;
  return Math.round(((newVal - oldVal) / oldVal) * 100);
}

/**
 * generateId
 * Creates a simple unique ID string.
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * getPriceTrend
 * Compares currentPrice vs lastPrice and returns the trend label.
 */
export function getPriceTrend(
  currentPrice: number,
  lastPrice: number | undefined
): 'increase' | 'decrease' | 'stable' {
  if (!lastPrice || lastPrice === 0) return 'stable';
  if (currentPrice > lastPrice) return 'increase';
  if (currentPrice < lastPrice) return 'decrease';
  return 'stable';
}

/**
 * getCurrentMonthYear
 * Returns { month (0-based), year } for today.
 */
export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear() };
}

/**
 * getPreviousMonthYear
 * Returns { month (0-based), year } for the previous calendar month.
 */
export function getPreviousMonthYear(): { month: number; year: number } {
  const now = new Date();
  const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return { month, year };
}
