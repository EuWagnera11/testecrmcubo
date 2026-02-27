
# Plano Completo: WhatsApp CRM Avancado + Handoff + Features

## Auditoria do Estado Atual

**O que ja existe e sera reaproveitado:**
- `useNotifications` hook com sistema de notificacoes in-memory (ate 50 items) + realtime via Supabase channels
- `NotificationDropdown` no Header com badge, marcar como lido, limpar
- `NotificationSettings` com toggles por categoria (tarefas, pagamentos, mensagens, etc.)
- `useChatNotifications` para mensagens de projetos
- Realtime ja ativo em `whatsapp_messages` (subscribe por conversa)
- Pipeline completo com stages, KPIs, filtros e integracao Asaas
- Dashboard com metricas financeiras, meta de receita, graficos
- `whatsapp_conversations` ja tem: `ai_summary`, `is_bot_active`, `last_message_preview`
- `whatsapp_contacts` ja tem: `name`, `phone`, `notes`, `tags`, `assigned_to`
- `whatsapp-bot-update` Edge Function ja salva mensagens do bot
- `whatsapp-send` Edge Function ja envia mensagens do humano
- **`bot_paused_until` NAO existe ainda** -- precisa ser adicionado

---

## Etapa 0 -- Simplificar UI + Handoff Automatico (Plano Anterior Pendente)

### 0.1 Limpar UI do WhatsApp (WhatsAppInbox.tsx)
- Remover botoes "Bot ativo"/"Ativar bot" do header do chat
- Remover painel de resumo IA (ai_summary panel)
- Remover badge "Atribuido"
- Manter label "Bot" (icone roxo) nas mensagens com `sender_type === "bot"`
- Remover imports nao usados: `Sparkles`, `UserCheck`

### 0.2 Migracao: adicionar `bot_paused_until`
```sql
ALTER TABLE whatsapp_conversations ADD COLUMN bot_paused_until TIMESTAMPTZ;
```

### 0.3 Handoff automatico nas Edge Functions
- **whatsapp-send**: ao enviar mensagem, setar `is_bot_active = false`, `bot_paused_until = now() + 1 hora`
- **whatsapp-webhook**: antes de fazer forward ao n8n, checar se `is_bot_active = false` e `bot_paused_until > now()` -- se sim, nao encaminha. Se `bot_paused_until` expirou, reativa o bot
- **whatsapp-bot-update**: checar se bot esta pausado antes de aceitar mensagem

---

## Etapa 1 -- Notificacoes Realtime do WhatsApp

### O que reaproveitar
- `useNotifications` hook (expandir com novos tipos)
- `NotificationDropdown` (ja no Header)
- `NotificationSettings` (adicionar toggle "WhatsApp")
- Toast pattern (sonner) ja usado em `useChatNotifications`

### O que criar/modificar
- **Expandir `useNotifications`**: adicionar subscribe em `whatsapp_conversations` (INSERT + UPDATE) para detectar:
  - Nova conversa (novo contato)
  - Conversa com `is_bot_active = false` (handoff detectado)
  - Mudanca de status da conversa
- **Badge no Sidebar**: mostrar contador de nao-lidas do WhatsApp no item de menu "WhatsApp" (usar `useWhatsAppUnreadCounts` que ja existe)
- **Som de notificacao**: adicionar toggle em `NotificationSettings`, tocar audio via `new Audio()` ao receber notificacao WhatsApp
- **Notificacao tipo `whatsapp_message`** adicionada ao tipo `Notification`

### Arquivos modificados
- `src/hooks/useNotifications.ts` -- novo subscribe para whatsapp_conversations
- `src/components/NotificationDropdown.tsx` -- icone para tipo whatsapp
- `src/components/NotificationSettings.tsx` -- toggle WhatsApp
- `src/components/layout/Sidebar.tsx` -- badge com contagem WhatsApp

---

## Etapa 2 -- Fila de Handoff

### O que reaproveitar
- Filtro de busca ja existente no WhatsAppInbox
- `useTakeOverConversation` hook (manter para usar no botao "Assumir")
- Tags de conversa ja existentes

### O que criar/modificar
- **Filtro "Aguardando Humano"**: adicionar tabs/filtro no topo da lista de conversas: "Todas" | "Aguardando" | "Em atendimento" | "Resolvidas"
  - Aguardando: `is_bot_active = false` (bot pausado por handoff)
  - Em atendimento: `assigned_to IS NOT NULL` e `is_bot_active = false`
  - Resolvidas: `status = 'resolved'`
- **Botao "Assumir"**: ao lado do nome do contato na conversa selecionada, seta `assigned_to = user.id`
- **Status visual**: badges coloridas na lista (amarelo=aguardando, azul=em atendimento, verde=resolvido)
- **Campo "Motivo resolucao"**: dialog ao clicar "Resolver" com select (financeiro, tecnico, cancelamento, outro) + textarea
- **Migracao**: adicionar `resolved_at TIMESTAMPTZ` e `resolution_reason TEXT` em `whatsapp_conversations`
- **Contador no Sidebar**: mostrar numero de conversas "aguardando" ao lado do badge de nao-lidas

### Arquivos modificados
- Migracao SQL para `resolved_at`, `resolution_reason`
- `src/hooks/useWhatsApp.ts` -- hooks `useResolveConversation`
- `src/components/whatsapp/WhatsAppInbox.tsx` -- filtros, botao assumir, dialog resolver
- `src/components/layout/Sidebar.tsx` -- contador "aguardando"

---

## Etapa 3 -- Respostas Rapidas

### O que reaproveitar
- Campo de input ja existente no chat (form com onSubmit)
- Pattern de CRUD ja usado em `useWhatsAppTemplates`
- `WhatsAppTemplates` component ja existente (templates de mensagem)

### O que criar
- **Tabela `quick_replies`**: nova tabela com `id`, `title`, `content`, `category`, `shortcut`, `use_count`, `created_by`, `created_at` + RLS
- **Hook `useQuickReplies`**: CRUD + incrementar `use_count`
- **Botao "Zap" no input**: ao lado do botao Send, abre popover com lista de respostas rapidas filtradas por busca
- **Autocomplete "/"**: ao digitar "/" no input, mostrar dropdown com atalhos disponiveis
- **Variaveis**: substituir `{{nome}}`, `{{telefone}}` pelos dados do contato da conversa ativa
- **CRUD na Settings**: nova tab "Respostas Rapidas" na pagina de Configuracoes

### Arquivos criados/modificados
- Migracao SQL para tabela `quick_replies`
- `src/hooks/useQuickReplies.ts` -- novo hook
- `src/components/whatsapp/WhatsAppInbox.tsx` -- botao + autocomplete no input
- `src/pages/Settings.tsx` -- nova tab "Respostas Rapidas"

---

## Etapa 4 -- Perfil do Contato

### O que reaproveitar
- `whatsapp_contacts` ja tem: `name`, `phone`, `notes`, `tags`, `assigned_to`
- Painel lateral do chat pode ser expandido (hoje nao existe, mas o layout flex permite)

### O que criar
- **Painel lateral no chat**: ao clicar no nome/avatar do contato no header, abre drawer/painel na direita com:
  - Nome, telefone, fonte do lead
  - Link com cliente existente (busca na tabela `clients` por telefone)
  - Notas internas (usar campo `notes` ja existente em `whatsapp_contacts`)
  - Botao "Editar" para atualizar nome/notas do contato
- **Tabela `whatsapp_contact_notes`**: para historico de notas internas da equipe (multiplas notas por contato)
- **Timeline de eventos**: listar mensagens com datas agrupadas, handoffs, resolucoes
- **Hook `useWhatsAppContact`**: query + mutation para editar contato

### Arquivos criados/modificados
- Migracao SQL para `whatsapp_contact_notes`
- `src/hooks/useWhatsApp.ts` -- hook de contato + notas
- `src/components/whatsapp/WhatsAppContactPanel.tsx` -- novo componente
- `src/components/whatsapp/WhatsAppInbox.tsx` -- integrar painel lateral

---

## Etapa 5 -- Dashboard Melhorado

### O que reaproveitar
- Pagina `Dashboard.tsx` existente (adicionar secao WhatsApp)
- Pagina `Pipeline.tsx` existente (adicionar filtro por origem)
- Componentes `Card`, `Badge`, graficos recharts ja usados

### O que criar/modificar no Dashboard
- **Novos cards WhatsApp** (abaixo dos cards existentes):
  - Conversas ativas (bot ativo)
  - Aguardando humano (bot pausado)
  - Resolvidas hoje
  - Tempo medio de resposta (calculado das mensagens)
- **Grafico de volume**: mensagens recebidas por dia (ultimos 7 dias) usando recharts
- Dados vindos de query agregada nas tabelas `whatsapp_conversations` e `whatsapp_messages`

### O que modificar no Pipeline
- **Filtro por origem**: adicionar opcao "WhatsApp" no select de filtro ja existente
- **Criar lead do WhatsApp**: botao na conversa resolvida para criar item no pipeline com dados do contato pre-preenchidos
- No pipeline item, mostrar badge "WhatsApp" quando `source = 'whatsapp'`

### Arquivos modificados
- `src/pages/Dashboard.tsx` -- secao WhatsApp com cards e grafico
- `src/pages/Pipeline.tsx` -- filtro por origem, badge WhatsApp
- `src/hooks/useWhatsApp.ts` -- hook para metricas agregadas
- `src/components/whatsapp/WhatsAppInbox.tsx` -- botao "Criar Lead" na conversa

---

## Resumo de Migracoes SQL

```sql
-- 1) bot_paused_until para handoff automatico
ALTER TABLE whatsapp_conversations ADD COLUMN bot_paused_until TIMESTAMPTZ;

-- 2) Campos de resolucao
ALTER TABLE whatsapp_conversations ADD COLUMN resolved_at TIMESTAMPTZ;
ALTER TABLE whatsapp_conversations ADD COLUMN resolution_reason TEXT;

-- 3) Respostas rapidas
CREATE TABLE quick_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'geral',
  shortcut TEXT,
  use_count INT DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage quick_replies"
  ON quick_replies FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 4) Notas de contato
CREATE TABLE whatsapp_contact_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE whatsapp_contact_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage contact notes"
  ON whatsapp_contact_notes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_contact_notes;
```

## Ordem de Implementacao

1. Etapa 0: Simplificar UI + handoff automatico (base para tudo)
2. Etapa 2: Fila de handoff (depende da etapa 0)
3. Etapa 1: Notificacoes realtime (complementa handoff)
4. Etapa 3: Respostas rapidas (independente)
5. Etapa 4: Perfil do contato (independente)
6. Etapa 5: Dashboard melhorado (depende de dados das etapas anteriores)

## Regras Seguidas
- Nenhum componente ou pagina duplicado
- Todos os hooks existentes reaproveitados
- Todas as novas tabelas com RLS
- Todas as queries com loading state e error handling
- Mobile-first (layout responsivo mantido)
- Identidade visual mantida (glass-card, badges, cores do tema)
