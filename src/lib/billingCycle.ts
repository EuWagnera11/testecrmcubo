import { addMonths, subMonths, setDate, startOfDay, endOfDay, format, isAfter, isBefore, isEqual } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Ciclo de fechamento: do dia 20 de um mês ao dia 19 do próximo mês.
 * Exemplo: 
 * - "Dezembro" = 20/Nov até 19/Dez
 * - "Janeiro" = 20/Dez até 19/Jan
 */

export interface BillingCycle {
  start: Date;
  end: Date;
  label: string;
  monthKey: string; // formato yyyy-MM para o mês de referência
}

/**
 * Retorna o ciclo de faturamento para um mês de referência.
 * O mês de referência é o mês que "termina" no dia 19.
 * Ex: para "Janeiro 2025", o ciclo vai de 20/Dez/2024 a 19/Jan/2025.
 */
export function getBillingCycle(referenceDate: Date): BillingCycle {
  // O mês de referência é o mês da data passada
  const refMonth = referenceDate.getMonth();
  const refYear = referenceDate.getFullYear();
  
  // Início: dia 20 do mês anterior
  const previousMonth = subMonths(new Date(refYear, refMonth, 1), 1);
  const cycleStart = startOfDay(setDate(previousMonth, 20));
  
  // Fim: dia 19 do mês de referência
  const cycleEnd = endOfDay(setDate(new Date(refYear, refMonth, 1), 19));
  
  const label = format(referenceDate, "MMMM 'de' yyyy", { locale: ptBR });
  const monthKey = format(referenceDate, 'yyyy-MM');
  
  return { start: cycleStart, end: cycleEnd, label, monthKey };
}

/**
 * Verifica se uma data está dentro de um ciclo de faturamento.
 */
export function isWithinBillingCycle(date: Date, cycle: BillingCycle): boolean {
  const d = startOfDay(date);
  return (isAfter(d, cycle.start) || isEqual(d, cycle.start)) && 
         (isBefore(d, cycle.end) || isEqual(d, cycle.end));
}

/**
 * Dado uma data qualquer, retorna qual é o mês de referência do ciclo.
 * Ex: 25/Dez/2024 → Janeiro 2025 (pois está no ciclo 20/Dez - 19/Jan)
 */
export function getCurrentBillingMonth(date: Date): Date {
  const day = date.getDate();
  
  if (day >= 20) {
    // A partir do dia 20, já pertence ao próximo mês
    return addMonths(new Date(date.getFullYear(), date.getMonth(), 1), 1);
  } else {
    // Do dia 1 ao 19, pertence ao mês atual
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
}

/**
 * Retorna o ciclo de faturamento atual baseado na data de hoje.
 */
export function getCurrentBillingCycle(): BillingCycle {
  const currentMonth = getCurrentBillingMonth(new Date());
  return getBillingCycle(currentMonth);
}
