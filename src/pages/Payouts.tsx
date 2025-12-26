import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Users, Wallet, CheckCircle2, Clock, Trash2, 
  DollarSign, TrendingUp, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAllPayouts, PayoutWithProject } from '@/hooks/useAllPayouts';
import { useUserRole } from '@/hooks/useUserRole';
import { PendingApproval } from '@/components/PendingApproval';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const roleLabels: Record<string, string> = {
  designer: 'Designer',
  copywriter: 'Copywriter',
  traffic_manager: 'Gestor de Tráfego',
  social_media: 'Social Media',
  director: 'Diretor',
  other: 'Outro',
};

export default function Payouts() {
  const { 
    pendingPayouts, 
    paidPayouts, 
    totalPending, 
    totalPaid, 
    isLoading, 
    updatePayout, 
    deletePayout 
  } = useAllPayouts();
  const { isAdmin, isDirector } = useUserRole();
  const [tab, setTab] = useState('pending');

  if (!isAdmin && !isDirector) {
    return (
      <PendingApproval 
        status="pending" 
        customMessage="Apenas diretores e administradores podem acessar a gestão de pagamentos."
      />
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleMarkAsPaid = async (payout: PayoutWithProject) => {
    await updatePayout.mutateAsync({
      id: payout.id,
      paid: true,
      paid_at: new Date().toISOString(),
    });
  };

  const handleMarkAsUnpaid = async (payout: PayoutWithProject) => {
    await updatePayout.mutateAsync({
      id: payout.id,
      paid: false,
      paid_at: null,
    });
  };

  const PayoutCard = ({ payout, showPaidAction }: { payout: PayoutWithProject; showPaidAction: boolean }) => (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
          payout.paid ? "bg-success/10" : "bg-warning/10"
        )}>
          {payout.paid 
            ? <CheckCircle2 className="h-5 w-5 text-success" />
            : <Clock className="h-5 w-5 text-warning" />
          }
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium truncate">{payout.member_name || 'Membro'}</p>
            <Badge variant="outline" className="text-xs shrink-0">
              {roleLabels[payout.role] || payout.role}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link 
              to={`/projetos/${payout.project_id}`} 
              className="hover:text-primary hover:underline truncate"
            >
              {payout.projects?.name || 'Projeto'}
            </Link>
            {payout.description && (
              <>
                <span>•</span>
                <span className="truncate">{payout.description}</span>
              </>
            )}
          </div>
          {payout.paid && payout.paid_at && (
            <p className="text-xs text-success mt-1">
              Pago em {format(new Date(payout.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3 ml-4">
        <p className="font-bold text-lg">{formatCurrency(Number(payout.amount))}</p>
        
        <div className="flex items-center gap-1">
          {showPaidAction ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-success border-success hover:bg-success hover:text-success-foreground"
              onClick={() => handleMarkAsPaid(payout)}
              disabled={updatePayout.isPending}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Pagar
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-muted-foreground"
              onClick={() => handleMarkAsUnpaid(payout)}
              disabled={updatePayout.isPending}
            >
              Desfazer
            </Button>
          )}
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir repasse?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O repasse de {formatCurrency(Number(payout.amount))} para {payout.member_name || 'Membro'} será removido permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => deletePayout.mutate(payout.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-muted-foreground text-sm uppercase tracking-wider mb-1">Gestão</p>
        <h1 className="text-3xl font-bold tracking-tight">Pagamentos da Equipe</h1>
        <p className="text-muted-foreground mt-1">Gerencie todos os repasses de funcionários</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-warning mt-1">{formatCurrency(totalPending)}</p>
                <p className="text-xs text-muted-foreground mt-1">{pendingPayouts.length} repasses</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagos</p>
                <p className="text-2xl font-bold text-success mt-1">{formatCurrency(totalPaid)}</p>
                <p className="text-xs text-muted-foreground mt-1">{paidPayouts.length} repasses</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Geral</p>
                <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(totalPending + totalPaid)}</p>
                <p className="text-xs text-muted-foreground mt-1">{pendingPayouts.length + paidPayouts.length} repasses</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payouts List */}
      <Card className="border-border/50">
        <CardHeader className="pb-0">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                Pendentes ({pendingPayouts.length})
              </TabsTrigger>
              <TabsTrigger value="paid" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Pagos ({paidPayouts.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : (
            <>
              {tab === 'pending' && (
                pendingPayouts.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-success/50 mb-4" />
                    <p className="text-muted-foreground">Nenhum pagamento pendente!</p>
                    <p className="text-sm text-muted-foreground mt-1">Todos os repasses foram pagos.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingPayouts.map((payout) => (
                      <PayoutCard key={payout.id} payout={payout} showPaidAction />
                    ))}
                  </div>
                )
              )}
              
              {tab === 'paid' && (
                paidPayouts.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Nenhum pagamento realizado ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paidPayouts.map((payout) => (
                      <PayoutCard key={payout.id} payout={payout} showPaidAction={false} />
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
