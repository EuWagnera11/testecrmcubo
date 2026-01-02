import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { clientSchema } from '@/lib/validation';
import { sanitizeForStorage, sanitizeEmail, sanitizePhone } from '@/lib/sanitize';
import { logAuditEvent } from '@/hooks/useAuditLog';

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  country_code: string | null;
  company: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  monthly_plan_value: number | null;
  plan_currency: string | null;
  plan_start_date: string | null;
  plan_billing_day: number | null;
}

export interface CreateClientData {
  name: string;
  email?: string;
  phone?: string;
  country_code?: string;
  company?: string;
  monthly_plan_value?: number;
  plan_currency?: string;
  plan_start_date?: string;
  plan_billing_day?: number;
}

export function useClients() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const clientsQuery = useQuery({
    queryKey: ['clients', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!user,
  });

  const createClient = useMutation({
    mutationFn: async (clientData: CreateClientData) => {
      // Validate and sanitize input
      const validation = clientSchema.safeParse(clientData);
      if (!validation.success) {
        throw new Error(validation.error.errors[0]?.message || 'Dados inválidos');
      }

      const sanitizedData = {
        name: sanitizeForStorage(validation.data.name, 100),
        email: validation.data.email ? sanitizeEmail(validation.data.email) : null,
        phone: validation.data.phone ? sanitizePhone(validation.data.phone) : null,
        company: validation.data.company ? sanitizeForStorage(validation.data.company, 100) : null,
        country_code: validation.data.country_code || '+55',
        user_id: user!.id,
        monthly_plan_value: clientData.monthly_plan_value ?? null,
        plan_currency: clientData.plan_currency ?? 'BRL',
        plan_start_date: clientData.plan_start_date ?? null,
        plan_billing_day: clientData.plan_billing_day ?? 1,
      };

      const { data, error } = await supabase
        .from('clients')
        .insert(sanitizedData)
        .select()
        .single();
      
      if (error) throw error;
      
      await logAuditEvent({
        action: 'data_create',
        tableName: 'clients',
        recordId: data.id,
        newData: { name: sanitizedData.name, email: sanitizedData.email },
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Cliente criado!',
        description: 'O cliente foi adicionado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar cliente',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, ...clientData }: Partial<Client> & { id: string }) => {
      // Sanitize input data
      const sanitizedData: Record<string, unknown> = {};
      if (clientData.name) sanitizedData.name = sanitizeForStorage(clientData.name, 100);
      if (clientData.email) sanitizedData.email = sanitizeEmail(clientData.email);
      if (clientData.phone) sanitizedData.phone = sanitizePhone(clientData.phone);
      if (clientData.company) sanitizedData.company = sanitizeForStorage(clientData.company, 100);
      if (clientData.country_code) sanitizedData.country_code = clientData.country_code;
      if (clientData.status) sanitizedData.status = clientData.status;
      if (clientData.monthly_plan_value !== undefined) sanitizedData.monthly_plan_value = clientData.monthly_plan_value;
      if (clientData.plan_currency !== undefined) sanitizedData.plan_currency = clientData.plan_currency;
      if (clientData.plan_start_date !== undefined) sanitizedData.plan_start_date = clientData.plan_start_date;
      if (clientData.plan_billing_day !== undefined) sanitizedData.plan_billing_day = clientData.plan_billing_day;

      const { data, error } = await supabase
        .from('clients')
        .update(sanitizedData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      await logAuditEvent({
        action: 'data_update',
        tableName: 'clients',
        recordId: id,
        newData: sanitizedData,
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Cliente atualizado!',
        description: 'As informações foram salvas.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar cliente',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await logAuditEvent({
        action: 'data_delete',
        tableName: 'clients',
        recordId: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Cliente removido',
        description: 'O cliente foi removido com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover cliente',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    clients: clientsQuery.data ?? [],
    isLoading: clientsQuery.isLoading,
    error: clientsQuery.error,
    createClient,
    updateClient,
    deleteClient,
  };
}
