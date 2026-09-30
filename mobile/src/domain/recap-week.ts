// Sources: /lib/stats/montreal-calendar.ts and /app/recap/page.tsx in the
// existing TapIt web app. The server-provided week start remains authoritative.
function dateKeyToOrdinal(dateKey: string) {
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

function ordinalToDateKey(ordinal: number) {
  return new Date(ordinal * 86_400_000).toISOString().slice(0, 10);
}

function addCalendarDays(dateKey: string, days: number) {
  const ordinal = dateKeyToOrdinal(dateKey);

  if (ordinal === null) {
    throw new Error("The supplied calendar date is invalid.");
  }

  return ordinalToDateKey(ordinal + days);
}

export function formatPreviousWeekRange(weekStart: string) {
  const weekEnd = addCalendarDays(weekStart, 6);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    timeZone: "America/Montreal",
  });
  const start = formatter.format(new Date(`${weekStart}T12:00:00Z`));
  const end = formatter.format(new Date(`${weekEnd}T12:00:00Z`));
  return `${start}–${end}`;
}
