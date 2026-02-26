import { parseISO, setDate, subMonths, addMonths, isAfter, isBefore, isEqual } from 'date-fns';

/**
 * Fiscal month logic: standard calendar month (day 1 to last day)
 * Example: "January 2025" = Jan 1 to Jan 31
 * Example: "December 2024" = Dec 1 to Dec 31
 */

export function getFiscalMonthRange(referenceDate: Date): { start: Date; end: Date } {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
  
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
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
  // Standard calendar month - just return the date as-is
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return parsedDate;
}

/**
 * Client-specific fiscal month logic with custom billing day
 * The billing month is named after the month it ENDS in (the month the client pays)
 * Example: billingDay = 12, "December 2025" = Dec 12 to Jan 11 (closes/bills in January, named December)
 * Example: billingDay = 20, "December 2025" = Dec 20 to Jan 19
 * 
 * @param referenceDate - The month we want data for (e.g., December 2025)
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
    // Custom billing cycle: starts on billingDay of CURRENT month, ends on billingDay-1 of NEXT month
    // This way "December" with billingDay=12 means Dec 12 to Jan 11
    start = setDate(referenceDate, validBillingDay);
    end = setDate(addMonths(referenceDate, 1), validBillingDay - 1);
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
 * Returns the month that the date's billing period is NAMED after
 * Example: Jan 3 with billingDay=12 → still in December's period (Dec 12 - Jan 11)
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
    // On or after billing day = current month's fiscal period
    return parsedDate;
  }
  // Before billing day = still in previous month's fiscal period
  return subMonths(parsedDate, 1);
}
