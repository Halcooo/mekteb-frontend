/**
 * Utility functions for formatting dates and times in Bosnian format
 * Provides consistent date/time formatting throughout the application
 */

// Bosnian month names
const BOSNIAN_MONTHS = [
  "januar",
  "februar",
  "mart",
  "april",
  "maj",
  "juni",
  "juli",
  "august",
  "septembar",
  "oktobar",
  "novembar",
  "decembar",
];

// Unused but kept for potential future use
// const BOSNIAN_MONTHS_SHORT = [
//   "jan",
//   "feb",
//   "mar",
//   "apr",
//   "maj",
//   "jun",
//   "jul",
//   "aug",
//   "sep",
//   "okt",
//   "nov",
//   "dec",
// ];

// Bosnian day names
const BOSNIAN_DAYS = [
  "nedjelja",
  "ponedjeljak",
  "utorak",
  "srijeda",
  "četvrtak",
  "petak",
  "subota",
];

// Unused but kept for potential future use
// const BOSNIAN_DAYS_SHORT = ["ned", "pon", "uto", "sri", "čet", "pet", "sub"];

/**
 * Format date in Bosnian style: dd.mm.yyyy
 * @param date - Date object, string, or timestamp
 * @returns Formatted date string (e.g., "04.10.2025")
 */
export function formatBosnianDate(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();

  return `${day}.${month}.${year}`;
}

/**
 * Format time in Bosnian style: HH:mm
 * @param date - Date object, string, or timestamp
 * @returns Formatted time string (e.g., "14:30")
 */
export function formatBosnianTime(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

/**
 * Format date and time in Bosnian style: dd.mm.yyyy HH:mm
 * @param date - Date object, string, or timestamp
 * @returns Formatted datetime string (e.g., "04.10.2025 14:30")
 */
export function formatBosnianDateTime(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  return `${formatBosnianDate(d)} ${formatBosnianTime(d)}`;
}

/**
 * Format date with full month name in Bosnian
 * @param date - Date object, string, or timestamp
 * @returns Formatted date string (e.g., "4. oktobar 2025")
 */
export function formatBosnianDateLong(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const day = d.getDate();
  const month = BOSNIAN_MONTHS[d.getMonth()];
  const year = d.getFullYear();

  return `${day}. ${month} ${year}`;
}

/**
 * Format date with day name and full date in Bosnian
 * @param date - Date object, string, or timestamp
 * @returns Formatted date string (e.g., "petak, 4. oktobar 2025")
 */
export function formatBosnianDateWithDay(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const dayName = BOSNIAN_DAYS[d.getDay()];
  const longDate = formatBosnianDateLong(d);

  return `${dayName}, ${longDate}`;
}

/**
 * Format relative time in Bosnian (e.g., "prije 2 sata", "juče", "danas")
 * @param date - Date object, string, or timestamp
 * @returns Formatted relative time string
 */
export function formatBosnianRelativeTime(
  date: Date | string | number
): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "upravo sada";
  if (diffMinutes < 60)
    return `prije ${diffMinutes} ${diffMinutes === 1 ? "minutu" : "minuta"}`;
  if (diffHours < 24)
    return `prije ${diffHours} ${
      diffHours === 1 ? "sat" : diffHours < 5 ? "sata" : "sati"
    }`;
  if (diffDays === 0) return "danas";
  if (diffDays === 1) return "juče";
  if (diffDays < 7)
    return `prije ${diffDays} ${diffDays < 5 ? "dana" : "dana"}`;

  return formatBosnianDate(d);
}

/**
 * Format date for form inputs (yyyy-mm-dd)
 * @param date - Date object, string, or timestamp
 * @returns ISO date string for HTML date inputs
 */
export function formatDateForInput(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Parse Bosnian date format (dd.mm.yyyy) to Date object
 * @param dateString - Date string in Bosnian format
 * @returns Date object or null if invalid
 */
export function parseBosnianDate(dateString: string): Date | null {
  const parts = dateString.split(".");
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  const date = new Date(year, month, day);

  // Validate the date
  if (
    date.getDate() !== day ||
    date.getMonth() !== month ||
    date.getFullYear() !== year
  ) {
    return null;
  }

  return date;
}

/**
 * Get current date formatted in Bosnian style
 * @returns Current date as Bosnian formatted string
 */
export function getCurrentBosnianDate(): string {
  return formatBosnianDate(new Date());
}

/**
 * Get current datetime formatted in Bosnian style
 * @returns Current datetime as Bosnian formatted string
 */
export function getCurrentBosnianDateTime(): string {
  return formatBosnianDateTime(new Date());
}
