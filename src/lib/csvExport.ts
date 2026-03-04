import { supabase } from "@/integrations/supabase/client";

export function jsonToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const escape = (val: unknown) => {
    const str = val === null || val === undefined ? "" : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };
  const rows = data.map((row) => headers.map((h) => escape(row[h])).join(","));
  return [headers.map((h) => escape(h)).join(","), ...rows].join("\n");
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function fetchAllRows(tableName: string): Promise<Record<string, unknown>[]> {
  let allData: Record<string, unknown>[] = [];
  let from = 0;
  const step = 1000;

  while (true) {
    const { data, error } = await (supabase as any).from(tableName).select("*").range(from, from + step - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = [...allData, ...data];
    if (data.length < step) break;
    from += step;
  }
  return allData;
}

export async function exportTableToCSV(tableName: string) {
  const data = await fetchAllRows(tableName);
  if (data.length === 0) throw new Error("Tabela vazia");
  const csv = jsonToCSV(data);
  downloadCSV(csv, `${tableName}_${new Date().toISOString().slice(0, 10)}.csv`);
  return data.length;
}
