import { format, parseISO, isValid } from "date-fns";
import { bs, enUS } from "date-fns/locale";

// Date format configurations for different locales
const DATE_FORMATS = {
  bs: {
    short: "dd.MM.yyyy",
    long: "dd. MMMM yyyy",
    dateTime: "dd.MM.yyyy HH:mm",
    time: "HH:mm",
  },
  en: {
    short: "MM/dd/yyyy",
    long: "MMMM dd, yyyy",
    dateTime: "MM/dd/yyyy HH:mm",
    time: "HH:mm",
  },
};

const DATE_LOCALES = {
  bs: bs,
  en: enUS,
};

export type DateFormatType = "short" | "long" | "dateTime" | "time";

/**
 * Format a date string or Date object according to locale and format type
 * @param date - Date string (ISO format) or Date object
 * @param formatType - Type of format to apply
 * @param locale - Locale code (defaults to 'bs')
 * @returns Formatted date string or original string if invalid
 */
export function formatDate(
  date: string | Date | null | undefined,
  formatType: DateFormatType = "short",
  locale: "bs" | "en" = "bs"
): string {
  if (!date) return "";

  try {
    let dateObj: Date;

    if (typeof date === "string") {
      // Handle both ISO strings and date strings
      dateObj = date.includes("T") ? parseISO(date) : new Date(date);
    } else {
      dateObj = date;
    }

    if (!isValid(dateObj)) {
      console.warn("Invalid date provided to formatDate:", date);
      return typeof date === "string" ? date : "";
    }

    const formatString = DATE_FORMATS[locale][formatType];
    const localeObj = DATE_LOCALES[locale];

    return format(dateObj, formatString, { locale: localeObj });
  } catch (error) {
    console.error("Error formatting date:", error);
    return typeof date === "string" ? date : "";
  }
}

/**
 * Format date for input fields (always returns YYYY-MM-DD format)
 * @param date - Date string or Date object
 * @returns Date string in YYYY-MM-DD format or empty string
 */
export function formatDateForInput(
  date: string | Date | null | undefined
): string {
  if (!date) return "";

  try {
    let dateObj: Date;

    if (typeof date === "string") {
      dateObj = date.includes("T") ? parseISO(date) : new Date(date);
    } else {
      dateObj = date;
    }

    if (!isValid(dateObj)) {
      return "";
    }

    return format(dateObj, "yyyy-MM-dd");
  } catch (error) {
    console.error("Error formatting date for input:", error);
    return "";
  }
}

/**
 * Get age from date of birth
 * @param dateOfBirth - Date of birth string or Date object
 * @returns Age in years or null if invalid date
 */
export function calculateAge(
  dateOfBirth: string | Date | null | undefined
): number | null {
  if (!dateOfBirth) return null;

  try {
    let birthDate: Date;

    if (typeof dateOfBirth === "string") {
      birthDate = dateOfBirth.includes("T")
        ? parseISO(dateOfBirth)
        : new Date(dateOfBirth);
    } else {
      birthDate = dateOfBirth;
    }

    if (!isValid(birthDate)) {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  } catch (error) {
    console.error("Error calculating age:", error);
    return null;
  }
}

/**
 * Check if a date is in the past
 * @param date - Date string or Date object
 * @returns Boolean indicating if date is in the past
 */
export function isPastDate(date: string | Date | null | undefined): boolean {
  if (!date) return false;

  try {
    let dateObj: Date;

    if (typeof date === "string") {
      dateObj = date.includes("T") ? parseISO(date) : new Date(date);
    } else {
      dateObj = date;
    }

    if (!isValid(dateObj)) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    dateObj.setHours(0, 0, 0, 0);

    return dateObj < today;
  } catch (error) {
    console.error("Error checking if date is in past:", error);
    return false;
  }
}
