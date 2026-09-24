export const MONTREAL_TIME_ZONE = "America/Montreal";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: MONTREAL_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

export function toMontrealDateKey(value: string | Date) {
  const date = toDate(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = dateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return year && month && day ? `${year}-${month}-${day}` : null;
}

export function dateKeyToOrdinal(dateKey: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return Math.floor(date.getTime() / 86_400_000);
}

export function ordinalToDateKey(ordinal: number) {
  return new Date(ordinal * 86_400_000).toISOString().slice(0, 10);
}

export function getMontrealWeekStart(value: string | Date = new Date()) {
  const dateKey = toMontrealDateKey(value);

  if (!dateKey) {
    throw new Error("The supplied date is invalid.");
  }

  const ordinal = dateKeyToOrdinal(dateKey)!;
  const isoDay = new Date(ordinal * 86_400_000).getUTCDay() || 7;
  return ordinalToDateKey(ordinal - (isoDay - 1));
}

export function addCalendarDays(dateKey: string, days: number) {
  const ordinal = dateKeyToOrdinal(dateKey);

  if (ordinal === null) {
    throw new Error("The supplied calendar date is invalid.");
  }

  return ordinalToDateKey(ordinal + days);
}
