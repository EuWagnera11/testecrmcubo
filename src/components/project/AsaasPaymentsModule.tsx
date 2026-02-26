import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Plus, RefreshCw, QrCode, Trash2, ExternalLink, Search, UserPlus } from 'lucide-react';
import { useAsaas, AsaasCustomer, AsaasPayment } from '@/hooks/useAsaas';
import { format } from 'date-fns';

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: 'bg-yellow-500/15 text-yellow-600' },
  RECEIVED: { label: 'Recebido', color: 'bg-green-500/15 text-green-600' },
  CONFIRMED: { label: 'Confirmado', color: 'bg-green-500/15 text-green-600' },
  OVERDUE: { label: 'Vencido', color: 'bg-red-500/15 text-red-600' },
  REFUNDED: { label: 'Estornado', color: 'bg-blue-500/15 text-blue-600' },
  RECEIVED_IN_CASH: { label: 'Recebido em dinheiro', color: 'bg-green-500/15 text-green-600' },
  REFUND_REQUESTED: { label: 'Estorno solicitado', color: 'bg-orange-500/15 text-orange-600' },
  CHARGEBACK_REQUESTED: { label: 'Chargeback', color: 'bg-red-500/15 text-red-600' },
  CHARGEBACK_DISPUTE: { label: 'Disputa', color: 'bg-red-500/15 text-red-600' },
  AWAITING_CHARGEBACK_REVERSAL: { label: 'Aguardando reversão', color: 'bg-orange-500/15 text-orange-600' },
  DUNNING_REQUESTED: { label: 'Negativação', color: 'bg-red-500/15 text-red-600' },
  DUNNING_RECEIVED: { label: 'Recuperado', color: 'bg-green-500/15 text-green-600' },
};

const billingTypes = [
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'CREDIT_CARD', label: 'Cartão de Crédito' },
  { value: 'PIX', label: 'PIX' },
  { value: 'UNDEFINED', label: 'Indefinido (cliente escolhe)' },
];

export function AsaasPaymentsModule({ projectId }: { projectId: string }) {
  const {
    loading, customers, payments,
    listCustomers, createCustomer, listPayments, createPayment, getPixQrCode, deletePayment,
  } = useAsaas();

  const [selectedCustomer, setSelectedCustomer] = useState<AsaasCustomer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [pixData, setPixData] = useState<{ encodedImage: string; payload: string } | null>(null);

  const [newPayment, setNewPayment] = useState({
    billingType: 'PIX',
    value: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    description: '',
  });

  const [newCustomer, setNewCustomer] = useState({
    name: '', cpfCnpj: '', email: '', phone: '',
  });

  useEffect(() => {
    listCustomers();
  }, []);

  const handleSearchCustomers = () => {
    listCustomers(customerSearch || undefined);
  };

  const handleSelectCustomer = (c: AsaasCustomer) => {
    setSelectedCustomer(c);
    listPayments(c.id);
  };

  const handleCreatePayment = async () => {
    if (!selectedCustomer || !newPayment.value) return;
    const result = await createPayment({
      customer: selectedCustomer.id,
      billingType: newPayment.billingType,
      value: parseFloat(newPayment.value),
      dueDate: newPayment.dueDate,
      description: newPayment.description,
      externalReference: projectId,
    });
    if (result) {
      setShowNewPayment(false);
      setNewPayment({ billingType: 'PIX', value: '', dueDate: format(new Date(), 'yyyy-MM-dd'), description: '' });
      listPayments(selectedCustomer.id);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.cpfCnpj) return;
    const result = await createCustomer(newCustomer);
    if (result) {
      setShowNewCustomer(false);
      setNewCustomer({ name: '', cpfCnpj: '', email: '', phone: '' });
      listCustomers();
    }
  };

  const handlePixQr = async (paymentId: string) => {
    const data = await getPixQrCode(paymentId);
    if (data) setPixData(data);
  };

  const handleDelete = async (paymentId: string) => {
    await deletePayment(paymentId);
    if (selectedCustomer) listPayments(selectedCustomer.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-emerald-500" />
          Pagamentos Asaas
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Customer Selection */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Clientes Asaas
              <Button size="icon" variant="ghost" onClick={() => setShowNewCustomer(true)}>
                <UserPlus className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-1">
              <Input
                placeholder="Buscar cliente..."
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearchCustomers()}
                className="text-sm"
              />
              <Button size="icon" variant="ghost" onClick={handleSearchCustomers} disabled={loading}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {customers.map(c => (
                <button
                  key={c.id}
                  className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                    selectedCustomer?.id === c.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => handleSelectCustomer(c)}
                >
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.cpfCnpj}</div>
                </button>
              ))}
              {customers.length === 0 && !loading && (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum cliente encontrado</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payments List */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              {selectedCustomer ? `Cobranças - ${selectedCustomer.name}` : 'Cobranças'}
              <div className="flex gap-1">
                {selectedCustomer && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => listPayments(selectedCustomer.id)} disabled={loading}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={() => setShowNewPayment(true)} className="gap-1">
                      <Plus className="h-4 w-4" /> Nova Cobrança
                    </Button>
                  </>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedCustomer ? (
              <p className="text-sm text-muted-foreground text-center py-8">Selecione um cliente para ver as cobranças</p>
            ) : payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma cobrança encontrada</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Descrição</TableHead>
                      <TableHead className="text-xs">Valor</TableHead>
                      <TableHead className="text-xs">Tipo</TableHead>
                      <TableHead className="text-xs">Vencimento</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map(p => {
                      const st = statusMap[p.status] || { label: p.status, color: 'bg-muted text-muted-foreground' };
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="text-sm">{p.description || '-'}</TableCell>
                          <TableCell className="text-sm font-medium">
                            R$ {Number(p.value).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {billingTypes.find(b => b.value === p.billingType)?.label || p.billingType}
                          </TableCell>
                          <TableCell className="text-xs">{p.dueDate}</TableCell>
                          <TableCell>
                            <Badge className={st.color}>{st.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {p.billingType === 'PIX' && p.status === 'PENDING' && (
                                <Button size="icon" variant="ghost" onClick={() => handlePixQr(p.id)} title="QR Code PIX">
                                  <QrCode className="h-4 w-4" />
                                </Button>
                              )}
                              {p.invoiceUrl && (
                                <Button size="icon" variant="ghost" asChild title="Ver fatura">
                                  <a href={p.invoiceUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                              {p.status === 'PENDING' && (
                                <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)} title="Remover">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Payment Dialog */}
      <Dialog open={showNewPayment} onOpenChange={setShowNewPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Cobrança</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Tipo de Pagamento</Label>
              <Select value={newPayment.billingType} onValueChange={v => setNewPayment(p => ({ ...p, billingType: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {billingTypes.map(b => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={newPayment.value}
                onChange={e => setNewPayment(p => ({ ...p, value: e.target.value }))}
                placeholder="100.00"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Vencimento</Label>
              <Input
                type="date"
                value={newPayment.dueDate}
                onChange={e => setNewPayment(p => ({ ...p, dueDate: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Descrição</Label>
              <Input
                value={newPayment.description}
                onChange={e => setNewPayment(p => ({ ...p, description: e.target.value }))}
                placeholder="Descrição da cobrança..."
                className="mt-1"
              />
            </div>
            <Button onClick={handleCreatePayment} disabled={loading || !newPayment.value} className="w-full">
              {loading ? 'Criando...' : 'Criar Cobrança'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Customer Dialog */}
      <Dialog open={showNewCustomer} onOpenChange={setShowNewCustomer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cliente Asaas</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome *</Label>
              <Input value={newCustomer.name} onChange={e => setNewCustomer(c => ({ ...c, name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">CPF/CNPJ *</Label>
              <Input value={newCustomer.cpfCnpj} onChange={e => setNewCustomer(c => ({ ...c, cpfCnpj: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input value={newCustomer.email} onChange={e => setNewCustomer(c => ({ ...c, email: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Telefone</Label>
              <Input value={newCustomer.phone} onChange={e => setNewCustomer(c => ({ ...c, phone: e.target.value }))} className="mt-1" />
            </div>
            <Button onClick={handleCreateCustomer} disabled={loading || !newCustomer.name || !newCustomer.cpfCnpj} className="w-full">
              {loading ? 'Criando...' : 'Criar Cliente'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIX QR Code Dialog */}
      <Dialog open={!!pixData} onOpenChange={() => setPixData(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code PIX</DialogTitle>
          </DialogHeader>
          {pixData && (
            <div className="flex flex-col items-center gap-4">
              <img src={`data:image/png;base64,${pixData.encodedImage}`} alt="PIX QR Code" className="w-48 h-48" />
              <div className="w-full">
                <Label className="text-xs">Código PIX (Copia e Cola)</Label>
                <Input value={pixData.payload} readOnly className="mt-1 text-xs" onClick={e => {
                  (e.target as HTMLInputElement).select();
                  navigator.clipboard.writeText(pixData.payload);
                }} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
