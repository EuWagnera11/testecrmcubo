import { useState } from 'react';
import { Plus, Trash2, DollarSign, Receipt, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useProjectAlterations, useProjectPayouts } from '@/hooks/useProjectFinancials';
import { useUserRole } from '@/hooks/useUserRole';

interface ProjectFinancialsProps {
  projectId: string;
  totalValue: number;
  currency: string;
}

const alterationTypes = [
  { value: 'revision', label: 'Revisão' },
  { value: 'extra_creative', label: 'Criativo Extra' },
  { value: 'urgency', label: 'Taxa de Urgência' },
  { value: 'change_scope', label: 'Mudança de Escopo' },
  { value: 'other', label: 'Outro' },
];

const roleTypes = [
  { value: 'designer', label: 'Designer' },
  { value: 'copywriter', label: 'Copywriter' },
  { value: 'traffic_manager', label: 'Gestor de Tráfego' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'director', label: 'Diretor' },
  { value: 'other', label: 'Outro' },
];

export function ProjectFinancials({ projectId, totalValue, currency }: ProjectFinancialsProps) {
  const { isAdmin, isDirector } = useUserRole();
  const canManage = isAdmin || isDirector;
  
  const { 
    alterations, 
    totalAlterations, 
    createAlteration, 
    deleteAlteration 
  } = useProjectAlterations(projectId);
  
  const { 
    payouts, 
    totalPayouts, 
    createPayout, 
    updatePayout,
    deletePayout 
  } = useProjectPayouts(projectId);

  const [alterationOpen, setAlterationOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);

  const formatCurrency = (value: number) => {
    const locales: Record<string, string> = { BRL: 'pt-BR', USD: 'en-US', EUR: 'de-DE' };
    return new Intl.NumberFormat(locales[currency] || 'pt-BR', { style: 'currency', currency }).format(value);
  };

  const grandTotal = totalValue + totalAlterations;
  const profit = grandTotal - totalPayouts;

  const handleCreateAlteration = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createAlteration.mutateAsync({
      project_id: projectId,
      alteration_type: formData.get('type') as string,
      description: formData.get('description') as string || null,
      value: Number(formData.get('value')) || 0,
    });
    setAlterationOpen(false);
  };

  const handleCreatePayout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createPayout.mutateAsync({
      project_id: projectId,
      role: formData.get('role') as string,
      member_name: formData.get('member_name') as string || null,
      amount: Number(formData.get('amount')) || 0,
      description: formData.get('description') as string || null,
      user_id: null,
      paid: false,
    });
    setPayoutOpen(false);
  };

  const handleTogglePaid = async (payout: any) => {
    await updatePayout.mutateAsync({
      id: payout.id,
      paid: !payout.paid,
      paid_at: !payout.paid ? new Date().toISOString() : null,
    });
  };

  if (!canManage) return null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-body">Valor Base</p>
            <p className="text-xl font-display text-foreground">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-body">Alterações</p>
            <p className="text-xl font-display text-warning">{formatCurrency(totalAlterations)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-body">Repasses Equipe</p>
            <p className="text-xl font-display text-destructive">{formatCurrency(totalPayouts)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-body">Lucro</p>
            <p className={`text-xl font-display ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(profit)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Alterations */}
        <Card className="border-border/50 glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-body flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                Alterações
              </CardTitle>
              <Dialog open={alterationOpen} onOpenChange={setAlterationOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-display">Nova Alteração</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateAlteration} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select name="type" required>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {alterationTypes.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor</Label>
                      <Input name="value" type="number" step="0.01" placeholder="0.00" className="h-11" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição (opcional)</Label>
                      <Input name="description" placeholder="Descrição da alteração" className="h-11" />
                    </div>
                    <Button type="submit" className="w-full h-11" disabled={createAlteration.isPending}>
                      {createAlteration.isPending ? 'Adicionando...' : 'Adicionar Alteração'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {alterations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 font-body">
                Nenhuma alteração registrada.
              </p>
            ) : (
              <div className="space-y-2">
                {alterations.map(alt => (
                  <div key={alt.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div>
                      <p className="font-medium text-sm font-body">
                        {alterationTypes.find(t => t.value === alt.alteration_type)?.label || alt.alteration_type}
                      </p>
                      {alt.description && (
                        <p className="text-xs text-muted-foreground">{alt.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-warning">{formatCurrency(Number(alt.value))}</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteAlteration.mutate(alt.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between px-3">
                  <span className="text-sm font-medium font-body">Total</span>
                  <span className="font-display text-warning">{formatCurrency(totalAlterations)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payouts */}
        <Card className="border-border/50 glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-body flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Repasses para Equipe
              </CardTitle>
              <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-display">Novo Repasse</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreatePayout} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Cargo/Função</Label>
                      <Select name="role" required>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione o cargo" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleTypes.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nome do Membro (opcional)</Label>
                      <Input name="member_name" placeholder="Nome do profissional" className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor</Label>
                      <Input name="amount" type="number" step="0.01" placeholder="0.00" className="h-11" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição (opcional)</Label>
                      <Input name="description" placeholder="Descrição do repasse" className="h-11" />
                    </div>
                    <Button type="submit" className="w-full h-11" disabled={createPayout.isPending}>
                      {createPayout.isPending ? 'Adicionando...' : 'Adicionar Repasse'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 font-body">
                Nenhum repasse registrado.
              </p>
            ) : (
              <div className="space-y-2">
                {payouts.map(payout => (
                  <div key={payout.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Button
                        size="icon"
                        variant={payout.paid ? "default" : "outline"}
                        className="h-7 w-7"
                        onClick={() => handleTogglePaid(payout)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <div>
                        <p className="font-medium text-sm font-body">
                          {roleTypes.find(t => t.value === payout.role)?.label || payout.role}
                          {payout.member_name && ` - ${payout.member_name}`}
                        </p>
                        {payout.paid && (
                          <Badge variant="outline" className="text-xs bg-success/15 text-success">Pago</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-display">{formatCurrency(Number(payout.amount))}</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-destructive"
                        onClick={() => deletePayout.mutate(payout.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between px-3">
                  <span className="text-sm font-medium font-body">Total</span>
                  <span className="font-display">{formatCurrency(totalPayouts)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
