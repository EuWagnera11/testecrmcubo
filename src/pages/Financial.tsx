import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { isWithinFiscalMonth } from '@/lib/fiscalMonth';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, TrendingUp, TrendingDown, Wallet, Trash2,
  ArrowUpRight, ArrowDownRight, Calendar, Filter,
  Clock, CheckCircle2, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
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
import { cn } from '@/lib/utils';
import { useFinancial } from '@/hooks/useFinancial';
import { useProjects } from '@/hooks/useProjects';
import { useUserRole } from '@/hooks/useUserRole';
import { useAllPayouts, PayoutWithProject } from '@/hooks/useAllPayouts';
import { PendingApproval } from '@/components/PendingApproval';
import { Link } from 'react-router-dom';

const roleLabels: Record<string, string> = {
  designer: 'Designer',
  copywriter: 'Copywriter',
  traffic_manager: 'Gestor de Tráfego',
  social_media: 'Social Media',
  director: 'Diretor',
  other: 'Outro',
};

const categories = {
  income: ['Projeto', 'Consultoria', 'Outros'],
  expense: ['Ferramentas', 'Marketing', 'Equipe', 'Infraestrutura', 'Outros'],
};

const months = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

export default function Financial() {
  const { transactions, isLoading, addTransaction, deleteTransaction } = useFinancial();
  const { projects } = useProjects();
  const { isAdmin, isDirector } = useUserRole();
  const { 
    pendingPayouts, 
    paidPayouts, 
    totalPending, 
    totalPaid, 
    isLoading: payoutsLoading, 
    updatePayout, 
    deletePayout 
  } = useAllPayouts();
  
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [date, setDate] = useState<Date>(new Date());
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>(currentYear.toString());
  const [mainTab, setMainTab] = useState('transactions');
  const [payoutTab, setPayoutTab] = useState('pending');

  // Only directors and admins can access financial
  if (!isAdmin && !isDirector) {
    return (
      <PendingApproval 
        status="pending" 
        customMessage="Apenas diretores e administradores podem acessar o módulo financeiro."
      />
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Filter transactions by fiscal month (20th to 19th)
  const filteredTransactions = useMemo(() => {
    if (!filterMonth) return transactions;
    
    const year = parseInt(filterYear);
    const month = parseInt(filterMonth) - 1;
    const referenceDate = new Date(year, month, 1);
    
    return transactions.filter(t => isWithinFiscalMonth(t.date, referenceDate));
  }, [transactions, filterMonth, filterYear]);

  // Compute totals based on filtered transactions
  const filteredTotalIncome = useMemo(() => 
    filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0),
    [filteredTransactions]
  );
  
  const filteredTotalExpenses = useMemo(() => 
    filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0),
    [filteredTransactions]
  );
  
  const filteredBalance = filteredTotalIncome - filteredTotalExpenses;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await addTransaction.mutateAsync({
      type,
      category: formData.get('category') as string,
      description: formData.get('description') as string || null,
      amount: Number(formData.get('amount')) || 0,
      project_id: formData.get('project_id') as string || null,
      date: format(date, 'yyyy-MM-dd'),
    });
    
    setOpen(false);
  };

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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm uppercase tracking-wider mb-1">Gestão</p>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
        </div>
        {mainTab === 'transactions' && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-11">
                <Plus className="h-4 w-4 mr-2" /> Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={type === 'income' ? 'default' : 'outline'}
                    onClick={() => setType('income')}
                    className="h-11"
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" /> Receita
                  </Button>
                  <Button
                    type="button"
                    variant={type === 'expense' ? 'default' : 'outline'}
                    onClick={() => setType('expense')}
                    className="h-11"
                  >
                    <ArrowDownRight className="h-4 w-4 mr-2" /> Despesa
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select name="category" required>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories[type].map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valor *</Label>
                  <Input name="amount" type="number" step="0.01" placeholder="0.00" required className="h-11" />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input name="description" placeholder="Descrição opcional" className="h-11" />
                </div>

                <div className="space-y-2">
                  <Label>Projeto Relacionado</Label>
                  <Select name="project_id">
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start h-11">
                        <Calendar className="mr-2 h-4 w-4" />
                        {format(date, "PPP", { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={date}
                        onSelect={(d) => d && setDate(d)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button type="submit" className="w-full h-11" disabled={addTransaction.isPending}>
                  {addTransaction.isPending ? 'Salvando...' : 'Salvar Transação'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="transactions" className="gap-2">
            <Wallet className="h-4 w-4" />
            Transações
          </TabsTrigger>
          <TabsTrigger value="payouts" className="gap-2">
            <Users className="h-4 w-4" />
            Pagamentos ({pendingPayouts.length})
          </TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6 mt-6">
          {/* Filter by period */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filtrar por período:</span>
                </div>
                <Select value={filterMonth || "all"} onValueChange={(v) => setFilterMonth(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-40 h-10">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {months.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="w-28 h-10">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {filterMonth && (
                  <Button variant="ghost" size="sm" onClick={() => setFilterMonth('')}>
                    Limpar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Receitas</p>
                    <p className="text-2xl font-bold text-success mt-1">{formatCurrency(filteredTotalIncome)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Despesas</p>
                    <p className="text-2xl font-bold text-destructive mt-1">{formatCurrency(filteredTotalExpenses)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo</p>
                    <p className={cn("text-2xl font-bold mt-1", filteredBalance >= 0 ? "text-success" : "text-destructive")}>
                      {formatCurrency(filteredBalance)}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions List */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">
                Transações {filterMonth && `- ${months.find(m => m.value === filterMonth)?.label}/${filterYear}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground text-center py-8">Carregando...</p>
              ) : filteredTransactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma transação encontrada para o período.</p>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center",
                          t.type === 'income' ? "bg-success/10" : "bg-destructive/10"
                        )}>
                          {t.type === 'income' 
                            ? <ArrowUpRight className="h-5 w-5 text-success" />
                            : <ArrowDownRight className="h-5 w-5 text-destructive" />
                          }
                        </div>
                        <div>
                          <p className="font-medium">{t.category}</p>
                          <p className="text-sm text-muted-foreground">
                            {t.description || format(new Date(t.date), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className={cn(
                          "font-bold",
                          t.type === 'income' ? "text-success" : "text-destructive"
                        )}>
                          {t.type === 'income' ? '+' : '-'} {formatCurrency(Number(t.amount))}
                        </p>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => deleteTransaction.mutate(t.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts" className="space-y-6 mt-6">
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
              <Tabs value={payoutTab} onValueChange={setPayoutTab}>
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
              {payoutsLoading ? (
                <p className="text-muted-foreground text-center py-8">Carregando...</p>
              ) : (
                <>
                  {payoutTab === 'pending' && (
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
                  
                  {payoutTab === 'paid' && (
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
