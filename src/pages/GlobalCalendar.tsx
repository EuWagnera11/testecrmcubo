import { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { cn } from '@/lib/utils';

const EVENT_TYPES = [
  { value: 'meeting', label: 'Reunião', color: '#3b82f6' },
  { value: 'deadline', label: 'Prazo', color: '#ef4444' },
  { value: 'delivery', label: 'Entrega', color: '#22c55e' },
  { value: 'followup', label: 'Follow-up', color: '#f97316' },
  { value: 'other', label: 'Outro', color: '#8b5cf6' },
];

export default function GlobalCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { events, isLoading, createEvent, deleteEvent } = useCalendarEvents(currentMonth);
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    event_type: 'meeting',
    start_time: '09:00',
    all_day: false,
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start to align with weekday
  const startDay = monthStart.getDay();
  const paddedDays = Array.from({ length: startDay }, (_, i) => null as Date | null).concat(days);

  const eventsByDay = useMemo(() => {
    const map: Record<string, typeof events> = {};
    for (const event of events) {
      const day = format(new Date(event.start_date), 'yyyy-MM-dd');
      if (!map[day]) map[day] = [];
      map[day].push(event);
    }
    return map;
  }, [events]);

  const handleCreate = () => {
    if (!selectedDate || !form.title) return;
    const startDate = new Date(selectedDate);
    const [h, m] = form.start_time.split(':');
    startDate.setHours(parseInt(h), parseInt(m));

    const typeConfig = EVENT_TYPES.find(t => t.value === form.event_type);

    createEvent.mutate({
      title: form.title,
      description: form.description || null,
      start_date: startDate.toISOString(),
      event_type: form.event_type,
      all_day: form.all_day,
      color: typeConfig?.color || '#3b82f6',
    }, {
      onSuccess: () => {
        setOpen(false);
        setForm({ title: '', description: '', event_type: 'meeting', start_time: '09:00', all_day: false });
      },
    });
  };

  const selectedDayEvents = selectedDate
    ? eventsByDay[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-1">Agenda</p>
          <h1 className="text-3xl font-bold tracking-tight">Calendário Global</h1>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-lg font-semibold capitalize">
          {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                  <div key={d} className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">
                    {d}
                  </div>
                ))}
                {paddedDays.map((day, i) => {
                  if (!day) return <div key={`pad-${i}`} className="bg-card p-2 min-h-[80px]" />;
                  const key = format(day, 'yyyy-MM-dd');
                  const dayEvents = eventsByDay[key] || [];
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        'bg-card p-2 min-h-[80px] text-left transition-colors hover:bg-accent/50',
                        isSelected && 'ring-2 ring-primary',
                        isToday(day) && 'bg-primary/5',
                      )}
                    >
                      <span className={cn(
                        'text-xs font-medium',
                        isToday(day) && 'text-primary font-bold',
                      )}>
                        {format(day, 'd')}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 3).map(ev => (
                          <div
                            key={ev.id}
                            className="text-[10px] truncate px-1 py-0.5 rounded"
                            style={{ backgroundColor: `${ev.color}20`, color: ev.color }}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 3}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day detail sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              {selectedDate ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">
                      {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <Dialog open={open} onOpenChange={setOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" /> Evento</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Novo Evento — {format(selectedDate, "dd/MM/yyyy")}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="space-y-2">
                            <Label>Título</Label>
                            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Tipo</Label>
                              <Select value={form.event_type} onValueChange={v => setForm(f => ({ ...f, event_type: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {EVENT_TYPES.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Horário</Label>
                              <Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                          </div>
                          <Button onClick={handleCreate} className="w-full" disabled={!form.title}>Criar Evento</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {selectedDayEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDayEvents.map(ev => (
                        <div key={ev.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                          <span className="h-2.5 w-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: ev.color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{ev.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(ev.start_date), 'HH:mm')}
                              {' · '}
                              {EVENT_TYPES.find(t => t.value === ev.event_type)?.label}
                            </p>
                            {ev.description && <p className="text-xs text-muted-foreground mt-1">{ev.description}</p>}
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteEvent.mutate(ev.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Selecione um dia</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
