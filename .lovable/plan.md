

# Agendamento de Reunioes no Pipeline + Notificacoes ao Lead

## Resumo

O SDR conversa com o lead, define um horario manualmente no CRM, e ao confirmar o agendamento o sistema envia automaticamente uma mensagem de confirmacao (WhatsApp + Email) e um lembrete 20 minutos antes.

## Mudancas

### 1. Banco de dados

**Novo estagio no pipeline**: Adicionar `meeting` entre `contacted` e `qualified` nos `PIPELINE_STAGES`.

**Nova tabela `pipeline_meetings`**:
- `id` (uuid PK)
- `pipeline_item_id` (FK sales_pipeline)
- `scheduled_at` (timestamptz) — data/hora da reuniao
- `meeting_link` (text nullable) — link Google Meet, Zoom, etc
- `location` (text nullable) — local presencial
- `notes` (text nullable)
- `confirmation_sent_at` (timestamptz nullable) — quando enviou confirmacao
- `reminder_sent_at` (timestamptz nullable) — quando enviou lembrete
- `status` (text default 'scheduled') — scheduled, completed, cancelled, no_show
- `created_by` (uuid FK auth.users)
- `created_at` (timestamptz default now())

RLS: Usuarios autenticados (mesma politica das demais tabelas do pipeline).

### 2. Edge Function `meeting-notify`

Responsavel por enviar notificacoes ao lead. Recebe:
```json
{
  "meeting_id": "uuid",
  "type": "confirmation" | "reminder"
}
```

Logica:
1. Busca dados do meeting + pipeline_item (nome, telefone, email)
2. Se tem telefone → envia via Evolution API (WhatsApp) usando mesma logica do `whatsapp-send`
3. Se tem email → envia via Edge Function com template formatado
4. Atualiza `confirmation_sent_at` ou `reminder_sent_at`

Templates de mensagem:
- **Confirmacao**: "Ola {nome}! Sua reuniao com a Cubo esta confirmada para {data} as {hora}. {link_se_houver}"
- **Lembrete 20min**: "Ola {nome}! Sua reuniao comeca em 20 minutos. {link_se_houver}"

### 3. Edge Function `meeting-reminders` (cron)

Roda a cada 5 minutos via `pg_cron`. Busca meetings onde:
- `scheduled_at` esta dentro dos proximos 20 min
- `reminder_sent_at` IS NULL
- `status` = 'scheduled'

Para cada um, chama `meeting-notify` com type `reminder`.

### 4. Interface — Pipeline.tsx

**Novo estagio visual**: `{ key: 'meeting', label: 'Reuniao Agendada', color: 'bg-indigo-500' }` entre Contatado e Qualificado.

**Dialog de agendamento**: Ao mover lead para estagio "Reuniao Agendada" ou clicar botao "Agendar Reuniao":
- Campo data/hora (input datetime-local)
- Campo link da reuniao (opcional)
- Campo local (opcional)
- Campo notas (opcional)
- Botao "Confirmar e Notificar"

Ao confirmar:
1. Insert na `pipeline_meetings`
2. Move lead para estagio `meeting`
3. Chama `meeting-notify` com type `confirmation`
4. Toast: "Reuniao agendada! Confirmacao enviada ao lead."

**No card do Kanban**: Mostrar badge com data/hora da reuniao quando houver meeting ativo.

### 5. Hook `usePipelineMeetings`

CRUD para `pipeline_meetings` + funcao `notifyMeeting(meetingId, type)` que invoca a Edge Function.

### 6. Integracao com WhatsApp

A funcao `meeting-notify` reutiliza a mesma logica de conexao com Evolution API que `whatsapp-send` ja usa (busca instancia ativa, normaliza telefone, POST `/message/sendText`).

Para email: como o projeto nao tem dominio de email configurado, o envio sera feito via WhatsApp como canal primario. Email fica preparado na estrutura mas so funciona quando o dominio for configurado.

---

## Secao Tecnica — Arquivos

| Arquivo | Mudanca |
|---|---|
| Migration SQL | Criar tabela `pipeline_meetings` com RLS |
| `supabase/functions/meeting-notify/index.ts` | Nova Edge Function — envia confirmacao/lembrete via WhatsApp |
| `supabase/functions/meeting-reminders/index.ts` | Nova Edge Function cron — dispara lembretes 20min |
| `supabase/config.toml` | Registrar `meeting-notify` e `meeting-reminders` com verify_jwt=false |
| `src/hooks/usePipelineMeetings.ts` | Novo hook CRUD + invoke notify |
| `src/hooks/usePipeline.ts` | Adicionar estagio `meeting` |
| `src/pages/Pipeline.tsx` | Dialog de agendamento, badge de reuniao nos cards |
| pg_cron SQL (insert tool) | Agendar `meeting-reminders` a cada 5 minutos |

### Ordem de implementacao

1. Migration: tabela `pipeline_meetings`
2. Edge Functions: `meeting-notify` + `meeting-reminders`
3. Config.toml + pg_cron
4. Hook `usePipelineMeetings`
5. UI: estagio + dialog + cards

