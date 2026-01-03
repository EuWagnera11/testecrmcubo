import { useState } from 'react';
import { 
  Plus, Pencil, Trash2, Loader2, DollarSign, Percent,
  User, Users, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCommissionRules, CommissionRule, CreateCommissionRuleInput } from '@/hooks/useCommissionRules';
import { useUsers } from '@/hooks/useUsers';
import { appRoleLabels } from '@/lib/roleConfig';

const roleOptions = [
  { value: 'traffic_manager', label: 'Gestor de Tráfego' },
  { value: 'designer', label: 'Designer' },
  { value: 'copywriter', label: 'Copywriter' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'director', label: 'Diretor' },
];

const baseFieldOptions = [
  { value: 'total_spend', label: 'Investimento Total' },
  { value: 'total_revenue', label: 'Receita Total' },
  { value: 'project_value', label: 'Valor dos Projetos' },
  { value: 'plan_value', label: 'Valor do Plano Mensal' },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

interface RuleFormData {
  name: string;
  description: string;
  target_type: 'role' | 'user';
  target_role: string;
  target_user_id: string;
  calc_type: 'percentage' | 'fixed';
  value: string;
  base_field: string;
  is_active: boolean;
}

const defaultFormData: RuleFormData = {
  name: '',
  description: '',
  target_type: 'role',
  target_role: '',
  target_user_id: '',
  calc_type: 'percentage',
  value: '',
  base_field: 'total_spend',
  is_active: true,
};

export function CommissionRulesManager() {
  const { rules, isLoading, createRule, updateRule, deleteRule, toggleRule } = useCommissionRules();
  const { users } = useUsers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<CommissionRule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>(defaultFormData);

  const approvedUsers = users.filter(u => u.status === 'approved');

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const handleOpenEdit = (rule: CommissionRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      target_type: rule.target_user_id ? 'user' : 'role',
      target_role: rule.target_role || '',
      target_user_id: rule.target_user_id || '',
      calc_type: rule.calc_type,
      value: rule.value.toString(),
      base_field: rule.base_field || 'total_spend',
      is_active: rule.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const input: CreateCommissionRuleInput = {
      name: formData.name,
      description: formData.description || null,
      target_role: formData.target_type === 'role' ? formData.target_role : null,
      target_user_id: formData.target_type === 'user' ? formData.target_user_id : null,
      calc_type: formData.calc_type,
      value: parseFloat(formData.value),
      base_field: formData.calc_type === 'percentage' ? formData.base_field as any : null,
      is_active: formData.is_active,
    };

    if (editingRule) {
      await updateRule.mutateAsync({ id: editingRule.id, ...input });
    } else {
      await createRule.mutateAsync(input);
    }

    setDialogOpen(false);
    setFormData(defaultFormData);
    setEditingRule(null);
  };

  const handleConfirmDelete = async () => {
    if (ruleToDelete) {
      await deleteRule.mutateAsync(ruleToDelete.id);
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    }
  };

  const getRuleTargetLabel = (rule: CommissionRule): string => {
    if (rule.target_user_id) {
      const user = approvedUsers.find(u => u.id === rule.target_user_id);
      return user?.full_name || 'Usuário';
    }
    if (rule.target_role) {
      return appRoleLabels[rule.target_role as keyof typeof appRoleLabels] || rule.target_role;
    }
    return 'Não definido';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Regras de Comissão</CardTitle>
              <CardDescription>
                Configure as regras para cálculo automático de comissões no fechamento mensal
              </CardDescription>
            </div>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Regra
          </Button>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma regra de comissão configurada.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie regras para calcular comissões automaticamente ao fechar meses.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div 
                  key={rule.id} 
                  className={`p-4 rounded-lg border transition-colors ${
                    rule.is_active 
                      ? 'border-border/50 bg-card' 
                      : 'border-border/30 bg-muted/30 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{rule.name}</h4>
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="outline" className="flex items-center gap-1">
                          {rule.target_user_id ? <User className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                          {getRuleTargetLabel(rule)}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {rule.calc_type === 'percentage' ? (
                            <>
                              <Percent className="h-3 w-3" />
                              {rule.value}% de {baseFieldOptions.find(b => b.value === rule.base_field)?.label || rule.base_field}
                            </>
                          ) : (
                            <>
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(Number(rule.value))} fixo
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => toggleRule.mutate({ id: rule.id, is_active: checked })}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(rule)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setRuleToDelete(rule);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Editar Regra' : 'Nova Regra de Comissão'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Regra *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Comissão Gestor de Tráfego"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva a regra..."
                rows={2}
              />
            </div>

            <div>
              <Label>Aplicar para</Label>
              <Select
                value={formData.target_type}
                onValueChange={(v) => setFormData({ ...formData, target_type: v as 'role' | 'user' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="role">Cargo (todos do cargo)</SelectItem>
                  <SelectItem value="user">Usuário específico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.target_type === 'role' ? (
              <div>
                <Label>Cargo</Label>
                <Select
                  value={formData.target_role}
                  onValueChange={(v) => setFormData({ ...formData, target_role: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label>Usuário</Label>
                <Select
                  value={formData.target_user_id}
                  onValueChange={(v) => setFormData({ ...formData, target_user_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || 'Sem nome'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Tipo de Cálculo</Label>
              <Select
                value={formData.calc_type}
                onValueChange={(v) => setFormData({ ...formData, calc_type: v as 'percentage' | 'fixed' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentual (%)</SelectItem>
                  <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="value">
                {formData.calc_type === 'percentage' ? 'Percentual (%)' : 'Valor (R$)'}
              </Label>
              <Input
                id="value"
                type="number"
                step={formData.calc_type === 'percentage' ? '0.1' : '0.01'}
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={formData.calc_type === 'percentage' ? 'Ex: 10' : 'Ex: 500.00'}
              />
            </div>

            {formData.calc_type === 'percentage' && (
              <div>
                <Label>Base de Cálculo</Label>
                <Select
                  value={formData.base_field}
                  onValueChange={(v) => setFormData({ ...formData, base_field: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {baseFieldOptions.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Regra ativa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.name || !formData.value || (formData.target_type === 'role' && !formData.target_role) || (formData.target_type === 'user' && !formData.target_user_id)}
            >
              {editingRule ? 'Salvar' : 'Criar Regra'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Regra</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a regra "{ruleToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
