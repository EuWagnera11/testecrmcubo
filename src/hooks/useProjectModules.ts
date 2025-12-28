import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Types
export interface ProjectStrategy {
  id: string;
  project_id: string;
  offer_big_idea: string | null;
  personas: string | null;
  funnel_structure: string | null;
  landing_page_url: string | null;
  landing_page_test_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectTechnicalSetup {
  id: string;
  project_id: string;
  meta_pixel_id: string | null;
  tiktok_pixel_id: string | null;
  ad_account_id: string | null;
  capi_status: string | null;
  utm_pattern: string | null;
  ads_manager_link: string | null;
  drive_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectCopyBank {
  id: string;
  project_id: string;
  angle: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreative {
  id: string;
  project_id: string;
  title: string;
  media_url: string | null;
  media_type: string;
  tags: string[] | null;
  dark_post_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectTest {
  id: string;
  project_id: string;
  hypothesis: string;
  variables: string | null;
  result: string | null;
  learnings: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectOptimizationLog {
  id: string;
  project_id: string;
  action_date: string;
  action_description: string;
  reason: string | null;
  user_id: string;
  created_at: string;
}

// Hook for Project Strategy
export function useProjectStrategy(projectId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['project-strategy', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('project_strategy')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      
      if (error) throw error;
      return data as ProjectStrategy | null;
    },
    enabled: !!projectId,
  });

  const upsert = useMutation({
    mutationFn: async (data: Partial<ProjectStrategy>) => {
      const existing = query.data;
      if (existing) {
        const { data: updated, error } = await supabase
          .from('project_strategy')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return updated;
      } else {
        const { data: created, error } = await supabase
          .from('project_strategy')
          .insert({ project_id: projectId!, ...data })
          .select()
          .single();
        if (error) throw error;
        return created;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-strategy', projectId] });
      toast({ title: 'Estratégia salva!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    },
  });

  return { strategy: query.data, isLoading: query.isLoading, upsertStrategy: upsert };
}

// Hook for Technical Setup
export function useProjectTechnicalSetup(projectId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['project-technical-setup', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('project_technical_setup')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      
      if (error) throw error;
      return data as ProjectTechnicalSetup | null;
    },
    enabled: !!projectId,
  });

  const upsert = useMutation({
    mutationFn: async (data: Partial<ProjectTechnicalSetup>) => {
      const existing = query.data;
      if (existing) {
        const { data: updated, error } = await supabase
          .from('project_technical_setup')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return updated;
      } else {
        const { data: created, error } = await supabase
          .from('project_technical_setup')
          .insert({ project_id: projectId!, ...data })
          .select()
          .single();
        if (error) throw error;
        return created;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-technical-setup', projectId] });
      toast({ title: 'Setup técnico salvo!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    },
  });

  return { technicalSetup: query.data, isLoading: query.isLoading, upsertTechnicalSetup: upsert };
}

// Hook for Copy Bank
export function useProjectCopyBank(projectId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['project-copy-bank', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_copy_bank')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProjectCopyBank[];
    },
    enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: async (data: { angle: string; content: string; status?: string }) => {
      const { data: created, error } = await supabase
        .from('project_copy_bank')
        .insert({ project_id: projectId!, ...data })
        .select()
        .single();
      if (error) throw error;
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-copy-bank', projectId] });
      toast({ title: 'Copy adicionada!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao adicionar', description: error.message, variant: 'destructive' });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<ProjectCopyBank>) => {
      const { data: updated, error } = await supabase
        .from('project_copy_bank')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-copy-bank', projectId] });
      toast({ title: 'Copy atualizada!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_copy_bank')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-copy-bank', projectId] });
      toast({ title: 'Copy removida!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    },
  });

  return { copyBank: query.data ?? [], isLoading: query.isLoading, createCopy: create, updateCopy: update, deleteCopy: remove };
}

// Hook for Creatives
export function useProjectCreatives(projectId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['project-creatives', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_creatives')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProjectCreative[];
    },
    enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: async (data: { title: string; media_url?: string; media_type?: string; tags?: string[]; dark_post_id?: string }) => {
      const { data: created, error } = await supabase
        .from('project_creatives')
        .insert({ project_id: projectId!, ...data })
        .select()
        .single();
      if (error) throw error;
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-creatives', projectId] });
      toast({ title: 'Criativo adicionado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao adicionar', description: error.message, variant: 'destructive' });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<ProjectCreative>) => {
      const { data: updated, error } = await supabase
        .from('project_creatives')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-creatives', projectId] });
      toast({ title: 'Criativo atualizado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_creatives')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-creatives', projectId] });
      toast({ title: 'Criativo removido!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    },
  });

  return { creatives: query.data ?? [], isLoading: query.isLoading, createCreative: create, updateCreative: update, deleteCreative: remove };
}

// Hook for Tests (Lab)
export function useProjectTests(projectId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['project-tests', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_tests')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProjectTest[];
    },
    enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: async (data: { hypothesis: string; variables?: string; status?: string }) => {
      const { data: created, error } = await supabase
        .from('project_tests')
        .insert({ project_id: projectId!, ...data })
        .select()
        .single();
      if (error) throw error;
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tests', projectId] });
      toast({ title: 'Teste adicionado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao adicionar', description: error.message, variant: 'destructive' });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<ProjectTest>) => {
      const { data: updated, error } = await supabase
        .from('project_tests')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tests', projectId] });
      toast({ title: 'Teste atualizado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_tests')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tests', projectId] });
      toast({ title: 'Teste removido!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    },
  });

  return { tests: query.data ?? [], isLoading: query.isLoading, createTest: create, updateTest: update, deleteTest: remove };
}

// Hook for Optimization Log
export function useProjectOptimizationLog(projectId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['project-optimization-log', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_optimization_log')
        .select('*')
        .eq('project_id', projectId)
        .order('action_date', { ascending: false });
      
      if (error) throw error;
      return data as ProjectOptimizationLog[];
    },
    enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: async (data: { action_description: string; reason?: string; action_date?: string }) => {
      const { data: created, error } = await supabase
        .from('project_optimization_log')
        .insert({ 
          project_id: projectId!, 
          user_id: user!.id,
          action_date: data.action_date || new Date().toISOString().split('T')[0],
          ...data 
        })
        .select()
        .single();
      if (error) throw error;
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-optimization-log', projectId] });
      toast({ title: 'Log adicionado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao adicionar', description: error.message, variant: 'destructive' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_optimization_log')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-optimization-log', projectId] });
      toast({ title: 'Log removido!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    },
  });

  return { logs: query.data ?? [], isLoading: query.isLoading, createLog: create, deleteLog: remove };
}
