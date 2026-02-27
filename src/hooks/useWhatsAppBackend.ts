import { useState, useCallback } from 'react';

const DEFAULT_URL = 'https://jdedyngozlmdjldhxwkw.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZWR5bmdvemxtZGpsZGh4d2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDE5MjMsImV4cCI6MjA4NzAxNzkyM30.p43NKoJpxZ5hn1QLTSpdZEHfiFZ1-ybYHT3GjGLJ-Hg';

const LS_URL_KEY = 'WA_SUPABASE_URL';
const LS_ANON_KEY = 'WA_SUPABASE_ANON_KEY';

export function useWhatsAppBackend() {
  const [url, setUrlState] = useState(() => localStorage.getItem(LS_URL_KEY) || DEFAULT_URL);
  const [key, setKeyState] = useState(() => localStorage.getItem(LS_ANON_KEY) || DEFAULT_KEY);

  const isConfigured = !!key;

  const setConfig = useCallback((newUrl: string, newKey: string) => {
    localStorage.setItem(LS_URL_KEY, newUrl);
    localStorage.setItem(LS_ANON_KEY, newKey);
    setUrlState(newUrl);
    setKeyState(newKey);
  }, []);

  const clearConfig = useCallback(() => {
    localStorage.setItem(LS_URL_KEY, DEFAULT_URL);
    localStorage.setItem(LS_ANON_KEY, DEFAULT_KEY);
    setUrlState(DEFAULT_URL);
    setKeyState(DEFAULT_KEY);
  }, []);

  const callFunction = useCallback(async (functionName: string, body: Record<string, unknown>) => {
    const currentUrl = localStorage.getItem(LS_URL_KEY) || DEFAULT_URL;
    const currentKey = localStorage.getItem(LS_ANON_KEY) || DEFAULT_KEY;

    if (!currentKey) {
      throw new Error('⚠️ Configure o backend primeiro');
    }

    const response = await fetch(`${currentUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }, []);

  return { url, key, isConfigured, setConfig, clearConfig, callFunction, DEFAULT_URL, DEFAULT_KEY };
}
