

# Pagina de Exportacao de Dados e SQL do Sistema

## Resumo

Criar uma nova pagina acessivel pelo sidebar (somente admin/director) que permite exportar todos os dados de cada tabela do banco em CSV e visualizar/copiar o SQL de criacao das tabelas para migracao.

## Estrutura

### 1. Nova rota e menu no sidebar

- Rota: `/exportar-dados` 
- Label no sidebar: "Exportar Dados" com icone `Database`
- Visivel apenas para admin/director (mesmo padrao de `directorOnly`)

### 2. Nova pagina `src/pages/DataExport.tsx`

Interface dividida em duas abas (Tabs):

**Aba "Exportar CSV"**
- Grid de cards, um por tabela do banco (agrupados por categoria)
- Categorias visuais:
  - **Clientes & Pipeline**: clients, sales_pipeline, webhook_leads, proposals, client_interactions, client_files, client_messages, client_month_closures
  - **Projetos**: projects, project_members, project_tasks, project_fields, project_messages, project_change_requests, campaigns, campaign_metrics, project_social_calendar, project_creatives, project_branding, project_strategy, etc.
  - **Financeiro**: financial_transactions, transaction_categories, contracts, contract_templates, closure_commissions, commission_rules, project_payouts, payment_reminders
  - **WhatsApp**: whatsapp_contacts, whatsapp_conversations, whatsapp_messages, whatsapp_instances, whatsapp_contact_notes, whatsapp_conversation_tags, whatsapp_tags, whatsapp_contact_memory, agent_memory
  - **Usuarios & Sistema**: profiles, user_roles, audit_logs, activity_logs, notification_preferences, achievements, onboarding_steps, courses, team_goals, monthly_goals, calendar_events
  - **Automacoes & Templates**: automation_flows, project_workflows, scheduled_reports, project_templates, quick_replies
- Cada card mostra nome da tabela + botao "Exportar CSV"
- Botao "Exportar Tudo" no topo que baixa um ZIP (ou exporta tabela por tabela)
- Ao clicar, faz `supabase.from('tabela').select('*')` e converte para CSV no frontend usando logica pura (sem lib extra)
- Paginacao automatica para tabelas com mais de 1000 rows (loop ate esgotar)

**Aba "SQL das Tabelas"**
- Textarea readonly com o SQL completo de CREATE TABLE de todas as tabelas
- SQL gerado estaticamente no codigo (hardcoded baseado no types.ts atual) -- nao e possivel consultar `information_schema` via client
- Botao "Copiar SQL" que copia tudo para o clipboard
- Inclui tambem as funcoes de seguranca (is_admin, has_role, etc.)

### 3. Logica de exportacao CSV

Novo utilitario `src/lib/csvExport.ts`:
- Funcao `exportTableToCSV(tableName)`: busca todos os registros via Supabase client, converte para CSV, dispara download
- Funcao `jsonToCSV(data)`: converte array de objetos em string CSV com headers automaticos
- Funcao `downloadCSV(csvString, filename)`: cria blob e dispara download via `<a>` temporario
- Loop de paginacao: busca em blocos de 1000 usando `.range(from, to)` ate retornar menos de 1000

### 4. Protecao de acesso

- Rota envolvida em `AdminRoute` (somente admin) ou verificacao `directorOnly` no sidebar
- RLS ja protege os dados -- so exporta o que o usuario autenticado tem permissao de ver

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/DataExport.tsx` | Criar -- pagina principal com tabs |
| `src/lib/csvExport.ts` | Criar -- utilitarios de exportacao |
| `src/components/layout/Sidebar.tsx` | Editar -- adicionar item "Exportar Dados" |
| `src/App.tsx` | Editar -- adicionar rota `/exportar-dados` |

Nenhuma migracao de banco necessaria. Tudo e leitura de dados existentes.

