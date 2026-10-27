// Compatibility exports for API normalization and older callers. New views pass their selected language to dateUtils.
import { formatDate, formatRelativeTime, parseDate, type DateValue } from './dateUtils.ts';
export { formatDateForInput } from './dateUtils.ts';
export const formatBosnianDate = (value: DateValue) => formatDate(value);
export const formatBosnianTime = (value: DateValue) => formatDate(value,'time');
export const formatBosnianDateTime = (value: DateValue) => formatDate(value,'dateTime');
export const formatBosnianDateLong = (value: DateValue) => formatDate(value,'long');
export const formatBosnianDateWithDay = (value: DateValue) => formatDate(value,'withDay');
export const formatBosnianRelativeTime = (value: DateValue) => formatRelativeTime(value);
export const getCurrentBosnianDate = () => formatBosnianDate(new Date());
export const getCurrentBosnianDateTime = () => formatBosnianDateTime(new Date());
export function parseBosnianDate(value: string): Date | null {
  const parts = /^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/.exec(value);
  return parts ? parseDate(`${parts[3]}-${parts[2].padStart(2,'0')}-${parts[1].padStart(2,'0')}`) : null;
}
