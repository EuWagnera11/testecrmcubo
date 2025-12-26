import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, TrendingUp, TrendingDown, DollarSign, Wallet, Trash2,
  ArrowUpRight, ArrowDownRight, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFinancial } from '@/hooks/useFinancial';
import { useProjects } from '@/hooks/useProjects';
import { useUserRole } from '@/hooks/useUserRole';
import { PendingApproval } from '@/components/PendingApproval';

const categories = {
  income: ['Projeto', 'Consultoria', 'Outros'],
  expense: ['Ferramentas', 'Marketing', 'Equipe', 'Infraestrutura', 'Outros'],
};

export default function Financial() {
  const { transactions, isLoading, addTransaction, deleteTransaction, totalIncome, totalExpenses, balance } = useFinancial();
  const { projects } = useProjects();
  const { isAdmin, isDirector } = useUserRole();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [date, setDate] = useState<Date>(new Date());

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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm uppercase tracking-wider mb-1">Gestão</p>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
        </div>
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receitas</p>
                <p className="text-2xl font-bold text-success mt-1">{formatCurrency(totalIncome)}</p>
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
                <p className="text-2xl font-bold text-destructive mt-1">{formatCurrency(totalExpenses)}</p>
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
                <p className={cn("text-2xl font-bold mt-1", balance >= 0 ? "text-success" : "text-destructive")}>
                  {formatCurrency(balance)}
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
          <CardTitle className="text-lg">Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma transação registrada.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((t) => (
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
    </div>
  );
}
