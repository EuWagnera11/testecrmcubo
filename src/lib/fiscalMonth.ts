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

/**
 * Client-specific fiscal month logic with custom billing day
 * Example: billingDay = 12 means the cycle runs from day 12 of month X-1 to day 11 of month X
 * Example: billingDay = 20 means the cycle runs from day 20 of month X-1 to day 19 of month X
 * 
 * @param referenceDate - The month we want data for (e.g., January 2025)
 * @param billingDay - The client's billing day (1-28). Default is 1 (standard calendar month)
 */
export function getClientFiscalMonthRange(referenceDate: Date, billingDay: number = 1): { start: Date; end: Date } {
  // Validate billing day (1-28 to avoid issues with short months)
  const validBillingDay = Math.max(1, Math.min(28, billingDay));
  
  let start: Date;
  let end: Date;
  
  if (validBillingDay === 1) {
    // Standard calendar month
    start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
    end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
  } else {
    // Custom billing cycle: starts on billingDay of previous month, ends on billingDay-1 of current month
    start = setDate(subMonths(referenceDate, 1), validBillingDay);
    end = setDate(referenceDate, validBillingDay - 1);
  }
  
  // Set time to beginning and end of day
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Check if a date falls within a client's custom fiscal month
 */
export function isWithinClientFiscalMonth(date: Date | string, referenceDate: Date, billingDay: number = 1): boolean {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  const { start, end } = getClientFiscalMonthRange(referenceDate, billingDay);
  
  return (isAfter(parsedDate, start) || isEqual(parsedDate, start)) && 
         (isBefore(parsedDate, end) || isEqual(parsedDate, end));
}

/**
 * Given a date, determine which client fiscal month it belongs to
 */
export function getClientFiscalMonthFromDate(date: Date | string, billingDay: number = 1): Date {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  const validBillingDay = Math.max(1, Math.min(28, billingDay));
  
  if (validBillingDay === 1) {
    // Standard calendar month - just return the date's month
    return parsedDate;
  }
  
  const day = parsedDate.getDate();
  
  if (day >= validBillingDay) {
    // Belongs to next month's fiscal period
    return addMonths(parsedDate, 1);
  }
  // Belongs to current month's fiscal period
  return parsedDate;
}
