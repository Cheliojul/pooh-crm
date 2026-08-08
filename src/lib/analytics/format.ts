// Shared display formatters. Null always renders as an em dash, matching the
// convention already used in orders-table.tsx.

const LOCALE = "en-US"

const EMPTY = "—"

const currencyFormatters = new Map<string, Intl.NumberFormat>()

const numberFormatter = new Intl.NumberFormat(LOCALE)

const compactFormatter = new Intl.NumberFormat(LOCALE, {
  notation: "compact",
  maximumFractionDigits: 1,
})

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  year: "numeric",
  month: "short",
  day: "numeric",
})

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

const monthFormatter = new Intl.DateTimeFormat(LOCALE, {
  year: "numeric",
  month: "short",
})

const MS_PER_DAY = 86_400_000

function currencyFormatter(currencyCode: string): Intl.NumberFormat {
  const existing = currencyFormatters.get(currencyCode)
  if (existing) return existing

  // An unrecognised currency code throws — fall back rather than crash a page.
  let formatter: Intl.NumberFormat
  try {
    formatter = new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    })
  } catch {
    formatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 })
  }

  currencyFormatters.set(currencyCode, formatter)
  return formatter
}

export function formatCurrency(value: number | null, currencyCode: string): string {
  return value === null || !Number.isFinite(value)
    ? EMPTY
    : currencyFormatter(currencyCode).format(value)
}

export function formatNumber(value: number | null): string {
  return value === null || !Number.isFinite(value) ? EMPTY : numberFormatter.format(value)
}

export function formatCompact(value: number | null): string {
  return value === null || !Number.isFinite(value) ? EMPTY : compactFormatter.format(value)
}

export function formatDecimal(value: number | null, digits = 1): string {
  return value === null || !Number.isFinite(value) ? EMPTY : value.toFixed(digits)
}

export function formatPercent(value: number | null, digits = 1): string {
  return value === null || !Number.isFinite(value)
    ? EMPTY
    : `${(value * 100).toFixed(digits)}%`
}

/** Signed, for delta columns. Zero renders as "0" without a sign. */
export function formatSigned(value: number | null, digits = 0): string {
  if (value === null || !Number.isFinite(value)) return EMPTY
  const rendered = digits > 0 ? Math.abs(value).toFixed(digits) : numberFormatter.format(Math.abs(value))
  if (value > 0) return `+${rendered}`
  if (value < 0) return `−${rendered}`
  return rendered
}

export function formatDate(value: string | null): string {
  if (!value) return EMPTY
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? EMPTY : dateFormatter.format(date)
}

export function formatDateTime(value: string | null): string {
  if (!value) return EMPTY
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? EMPTY : dateTimeFormatter.format(date)
}

export function formatMonth(month: string): string {
  const date = new Date(`${month}-01T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? month : monthFormatter.format(date)
}

/** "today", "6d ago", "3mo ago", "2y ago". */
export function formatAgo(value: string | null, now: number = Date.now()): string {
  if (!value) return EMPTY
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return EMPTY

  const days = Math.floor((now - then) / MS_PER_DAY)
  if (days <= 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

/** "4y 2mo" — for shop age, where a raw day count is hard to read. */
export function formatDuration(days: number | null): string {
  if (days === null || !Number.isFinite(days) || days < 0) return EMPTY
  const whole = Math.floor(days)
  if (whole < 60) return `${whole}d`

  const years = Math.floor(whole / 365)
  const months = Math.floor((whole % 365) / 30)
  if (years === 0) return `${months}mo`
  return months === 0 ? `${years}y` : `${years}y ${months}mo`
}
