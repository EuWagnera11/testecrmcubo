import { supabase } from '@/integrations/supabase/client';

type AuditAction = 
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'signup'
  | 'password_reset'
  | 'role_change'
  | 'user_approved'
  | 'user_rejected'
  | 'data_create'
  | 'data_update'
  | 'data_delete'
  | 'data_access'
  | 'share_link_access'
  | 'failed_access_attempt';

interface AuditLogParams {
  action: AuditAction;
  tableName?: string;
  recordId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}

/**
 * Hook to log security audit events
 */
export function useAuditLog() {
  const logEvent = async ({
    action,
    tableName,
    recordId,
    oldData,
    newData,
  }: AuditLogParams) => {
    try {
      await supabase.rpc('log_audit_event', {
        _action: action,
        _table_name: tableName || null,
        _record_id: recordId || null,
        _old_data: oldData ? JSON.stringify(oldData) : null,
        _new_data: newData ? JSON.stringify(newData) : null,
      });
    } catch (error) {
      // Silently fail - don't break the app for audit logging failures
      console.error('Audit log error:', error);
    }
  };

  return { logEvent };
}

/**
 * Standalone function to log audit events (for use outside React components)
 */
export async function logAuditEvent(params: AuditLogParams) {
  try {
    await supabase.rpc('log_audit_event', {
      _action: params.action,
      _table_name: params.tableName || null,
      _record_id: params.recordId || null,
      _old_data: params.oldData ? JSON.stringify(params.oldData) : null,
      _new_data: params.newData ? JSON.stringify(params.newData) : null,
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}
