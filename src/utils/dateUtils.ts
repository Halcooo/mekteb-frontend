import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { bs, enUS } from 'date-fns/locale';

export type DateValue = string | Date | number | null | undefined;
export type DateFormatType = 'short' | 'long' | 'dateTime' | 'time' | 'withDay' | 'compact';
export const dateLanguage = (language = 'bs') => language.toLowerCase().startsWith('en') ? 'en' : 'bs';
const patterns = {
  bs: { short:'dd.MM.yyyy.', long:'dd.MM.yyyy.', dateTime:'dd.MM.yyyy. HH:mm', time:'HH:mm', withDay:'EEEE, dd.MM.yyyy.', compact:'dd.MM.yyyy.' },
  en: { short:'dd.MM.yyyy.', long:'dd.MM.yyyy.', dateTime:'dd.MM.yyyy. HH:mm', time:'HH:mm', withDay:'EEEE, dd.MM.yyyy.', compact:'dd.MM.yyyy.' },
};

/** Calendar dates are local dates, never UTC instants. Reject overflow such as February 30. */
export function parseDate(value: DateValue): Date | null {
  if (value === null || value === undefined || value === '') return null;
  let result: Date;
  if (typeof value === 'string') {
    const calendar = /^(\d{4})-(\d{2})-(\d{2})(?:$|T| )/.exec(value);
    if (!calendar) return null;
    const [,year,month,day] = calendar.map(Number);
    const check = new Date(0);
    check.setFullYear(year, month - 1, day);
    check.setHours(0, 0, 0, 0);
    if (check.getFullYear() !== year || check.getMonth() !== month - 1 || check.getDate() !== day) return null;
    result = value.length === 10 ? check : parseISO(value);
  } else result = new Date(value);
  return isValid(result) ? result : null;
}

export function formatDate(value: DateValue, type: DateFormatType = 'short', language = 'bs'): string {
  const date = parseDate(value);
  if (!date) return '';
  const lng = dateLanguage(language);
  return format(date, patterns[lng][type], {locale: lng === 'en' ? enUS : bs});
}

export function formatDateForInput(value: DateValue): string {
  const date = parseDate(value);
  return date ? format(date, 'yyyy-MM-dd') : '';
}

export function formatRelativeTime(value: DateValue, language = 'bs'): string {
  const date = parseDate(value);
  return date ? formatDistanceToNow(date, {addSuffix:true, locale:dateLanguage(language) === 'en' ? enUS : bs}) : '';
}

export function calculateAge(value: DateValue, today = new Date()): number | null {
  const birthDate = parseDate(value);
  if (!birthDate || birthDate > today) return null;
  let age = today.getFullYear() - birthDate.getFullYear();
  if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;
  return age;
}

export function isPastDate(value: DateValue): boolean {
  const date = parseDate(value), today = new Date();
  if (!date) return false;
  today.setHours(0,0,0,0);
  date.setHours(0,0,0,0);
  return date < today;
}

/** Always navigate from the first day, including when the selection is January 31 or February 29. */
export function shiftCalendarMonth(value: Date, months: number): Date {
  return new Date(value.getFullYear(), value.getMonth() + months, 1);
}
