import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

async function callAsaas(action: string, params: Record<string, any>, accessToken: string) {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asaas-proxy`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ action, ...params }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  cpfCnpj: string;
  email: string;
  phone: string;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  value: number;
  netValue: number;
  billingType: string;
  status: string;
  dueDate: string;
  description: string;
  invoiceUrl: string;
  bankSlipUrl: string;
  paymentDate: string | null;
}

export function useAsaas() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<AsaasCustomer[]>([]);
  const [payments, setPayments] = useState<AsaasPayment[]>([]);

  const call = useCallback(async (action: string, params: Record<string, any> = {}) => {
    if (!session) throw new Error('Não autenticado');
    return callAsaas(action, params, session.access_token);
  }, [session]);

  const listCustomers = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const res = await call('list_customers', { name: search, limit: 50 });
      setCustomers(res.data || []);
      return res.data || [];
    } catch (err: any) {
      toast({ title: 'Erro ao buscar clientes Asaas', description: err.message, variant: 'destructive' });
      return [];
    } finally {
      setLoading(false);
    }
  }, [call, toast]);

  const createCustomer = useCallback(async (data: { name: string; cpfCnpj: string; email?: string; phone?: string }) => {
    setLoading(true);
    try {
      const res = await call('create_customer', data);
      toast({ title: 'Cliente criado na Asaas!' });
      return res;
    } catch (err: any) {
      toast({ title: 'Erro ao criar cliente', description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [call, toast]);

  const listPayments = useCallback(async (customerId?: string) => {
    setLoading(true);
    try {
      const res = await call('list_payments', { customer: customerId, limit: 50 });
      setPayments(res.data || []);
      return res.data || [];
    } catch (err: any) {
      toast({ title: 'Erro ao buscar cobranças', description: err.message, variant: 'destructive' });
      return [];
    } finally {
      setLoading(false);
    }
  }, [call, toast]);

  const createPayment = useCallback(async (data: {
    customer: string;
    billingType: string;
    value: number;
    dueDate: string;
    description?: string;
    externalReference?: string;
  }) => {
    setLoading(true);
    try {
      const res = await call('create_payment', data);
      toast({ title: 'Cobrança criada!' });
      return res;
    } catch (err: any) {
      toast({ title: 'Erro ao criar cobrança', description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [call, toast]);

  const getPixQrCode = useCallback(async (paymentId: string) => {
    try {
      return await call('get_pix_qrcode', { id: paymentId });
    } catch (err: any) {
      toast({ title: 'Erro ao gerar QR Code PIX', description: err.message, variant: 'destructive' });
      return null;
    }
  }, [call, toast]);

  const deletePayment = useCallback(async (paymentId: string) => {
    setLoading(true);
    try {
      await call('delete_payment', { id: paymentId });
      toast({ title: 'Cobrança removida!' });
    } catch (err: any) {
      toast({ title: 'Erro ao remover cobrança', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [call, toast]);

  return {
    loading,
    customers,
    payments,
    listCustomers,
    createCustomer,
    listPayments,
    createPayment,
    getPixQrCode,
    deletePayment,
  };
}
