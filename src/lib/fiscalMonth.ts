import { parseISO, setDate, subMonths, addMonths, isAfter, isBefore, isEqual } from 'date-fns';

/**
 * Fiscal month logic: day 20 of month X to day 19 of month X+1
 * Example: "January 2025" fiscal = Dec 20, 2024 to Jan 19, 2025
 * Example: "December 2024" fiscal = Nov 20, 2024 to Dec 19, 2024
 */

export function getFiscalMonthRange(referenceDate: Date): { start: Date; end: Date } {
  // Fiscal month X starts on day 20 of month X-1 and ends on day 19 of month X
  const fiscalMonthStart = setDate(subMonths(referenceDate, 1), 20);
  const fiscalMonthEnd = setDate(referenceDate, 19);
  
  // Set time to beginning and end of day
  fiscalMonthStart.setHours(0, 0, 0, 0);
  fiscalMonthEnd.setHours(23, 59, 59, 999);
  
  return { start: fiscalMonthStart, end: fiscalMonthEnd };
}

export function isWithinFiscalMonth(date: Date | string, referenceDate: Date): boolean {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  const { start, end } = getFiscalMonthRange(referenceDate);
  
  return (isAfter(parsedDate, start) || isEqual(parsedDate, start)) && 
         (isBefore(parsedDate, end) || isEqual(parsedDate, end));
}

export function getFiscalMonthKey(referenceDate: Date): string {
  // Returns YYYY-MM format for the fiscal month
  return `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}`;
}

export function getFiscalMonthFromDate(date: Date | string): Date {
  // Given an actual date, returns which fiscal month it belongs to
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  const day = parsedDate.getDate();
  
  if (day >= 20) {
    // Belongs to next month's fiscal period
    return addMonths(parsedDate, 1);
  }
  // Belongs to current month's fiscal period
  return parsedDate;
}
