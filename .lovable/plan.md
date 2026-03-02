
# 9 Correcoes Criticas + Melhorias UX no WhatsApp CRM

## 1. Bug — Deletar conversa nao funciona

**Causa raiz**: O codigo em `useDeleteConversation` tenta deletar mensagens antes da conversa, mas a tabela `whatsapp_messages` nao tem policy de DELETE para usuarios autenticados. A policy "Deny anonymous access" com `qual: false` bloqueia tudo silenciosamente.

**Solucao**: Ambas as foreign keys (`whatsapp_messages` e `whatsapp_conversation_tags`) ja tem `ON DELETE CASCADE`. Basta remover a exclusao manual de mensagens do hook e deletar apenas a conversa — as mensagens e tags serao removidas automaticamente pelo CASCADE.

**Arquivo**: `src/hooks/useWhatsApp.ts` — simplificar `useDeleteConversation` para deletar apenas `whatsapp_conversations`.

Adicionalmente, melhorar o toast de erro com a mensagem real do Supabase.

---

## 2. Bug — Duplicacao de contato

**Analise do banco**: Ha apenas 1 contato com telefone `5585991670420`. A duplicacao visivel pode estar vindo de conversas separadas (uma criada manualmente via modal, outra via webhook) apontando para o mesmo contato, ou de inconsistencia de normalizacao no webhook.

**Solucao no `whatsapp-webhook`**: A funcao `normalizePhone` ja existe e trata o prefixo 55 duplicado. Reforcar a normalizacao adicionando tratamento para numeros sem DDI (ex: `85991670420` -> `5585991670420`) para que a busca de contato existente sempre encontre o mesmo registro.

**Solucao no `whatsapp-send`**: Ja usa `normalizePhone`. Nenhuma mudanca necessaria.

**Solucao no frontend (`WhatsAppNewChat.tsx`)**: Normalizar o telefone antes de chamar `sendMessage` ou criar contato.

---

## 3. Area clicavel do perfil (maior)

**Arquivo**: `src/components/whatsapp/WhatsAppInbox.tsx` (ChatArea, linhas 574-586)

**Mudanca**: Envolver Avatar + nome + telefone em um unico `div` clicavel com hover visual, substituindo o `button` que envolve apenas o Avatar.

---

## 4. Dark mode — paleta marrom para cinza

**Arquivo**: `src/index.css` (bloco `.dark`, linhas 71-105)

**Problema**: As variaveis dark usam matiz (hue) 24 (laranja/marrom) para backgrounds e borders, gerando tom acastanhado.

**Correcao**: Trocar para matiz neutra (220-222) nos backgrounds, cards, muted e borders. Manter `--primary: 24 100% 50%` intacto como accent laranja.

```text
Valores novos:
--background: 222 20% 8%
--foreground: 210 40% 98%
--card: 222 18% 11%
--card-foreground: 210 40% 98%
--secondary: 222 18% 15%
--muted: 217 18% 15%
--muted-foreground: 215 20% 60%
--border: 217 18% 18%
--input: 217 18% 16%
--sidebar-background: 222 18% 11%
--sidebar-accent: 217 18% 16%
--sidebar-border: 217 18% 18%
```

---

## 5. Respostas rapidas — templates nao carregam

**Analise RLS**: A policy `quick_replies` tem `cmd: ALL` com `qual: true` (permite tudo para autenticados). RLS nao e o bloqueio.

**Causa provavel**: A query funciona, mas o popover pode estar vazio se nenhum template foi criado na tabela `quick_replies` (diferente de `whatsapp_templates`). Sao tabelas separadas.

**Solucao**:
- Adicionar loading state ("Carregando...") e empty state com link para criar template no popover
- Adicionar `console.error` no `useQuickReplies` para debug de erros
- Verificar se o usuario esta criando em `quick_replies` ou em `whatsapp_templates` (sao tabelas diferentes)

**Arquivo**: `src/components/whatsapp/WhatsAppInbox.tsx` (popover, linhas 676-695)

---

## 6. Notas do perfil — editar + excluir

**Arquivo**: `src/components/whatsapp/WhatsAppContactPanel.tsx`

**Mudancas**:
- Adicionar `updateNote` e `deleteNote` mutations no hook `useContactNotes`
- Cada nota tera botoes de editar (inline) e excluir (com confirmacao)
- Editar: transforma texto em Input, com botoes Salvar/Cancelar
- Excluir: confirmacao via `confirm()` antes de DELETE

**RLS**: A policy atual (`ALL` com `true`) permite tudo. Idealmente restringir para `user_id = auth.uid()` mas isso pode ser feito separadamente.

---

## 7. Conexoes — editar conexao existente

**Arquivo**: `src/components/whatsapp/WhatsAppInstances.tsx`

**Mudancas**:
- Adicionar `updateInstance` mutation no `useWhatsAppInstances` (hook em `useWhatsApp.ts`)
- Botao de editar por instancia que abre modal com campos pre-preenchidos
- Campos: nome, URL, API Key (password toggle), nome da instancia
- Validacao: URL deve comecar com `https://`
- UPDATE na tabela `whatsapp_instances`

---

## 8. Layout WhatsApp — aumentar espaco

**Arquivo**: `src/components/whatsapp/WhatsAppInbox.tsx`

**Mudancas**:
- Lista de conversas: `w-80` -> `w-80 lg:w-[320px]`
- Messages area: padding `p-4` -> `p-5`, gap `space-y-2` -> `space-y-3`
- Baloes: ja estao `max-w-[70%]` (ok)
- Chat header: `py-3` -> `py-4` (64px)
- Input area: `p-3` -> `p-4`
- Fonte mensagens: `text-sm` -> `text-[15px]`
- Timestamps: adicionar `mb-1` para espaco

---

## 9. Templates — editar nao funciona

**Arquivo**: `src/components/whatsapp/WhatsAppTemplates.tsx`

**Mudancas**:
- Adicionar `updateTemplate` mutation no `useWhatsAppTemplates` (hook em `useWhatsApp.ts`)
- Botao de editar por template que abre modal com campos pre-preenchidos
- Campos: nome, conteudo, categoria
- UPDATE na tabela `whatsapp_templates`
- Validacao: nome e conteudo obrigatorios
- Toast de sucesso

---

## Secao Tecnica — Resumo de Arquivos

| Arquivo | Mudancas |
|---|---|
| `src/hooks/useWhatsApp.ts` | Simplificar deleteConversation (sem delete manual de mensagens), adicionar updateInstance e updateTemplate mutations |
| `src/components/whatsapp/WhatsAppInbox.tsx` | Area clicavel perfil, layout maior, loading state no popover quick replies |
| `src/index.css` | Dark mode: trocar matiz 24 (marrom) por 220-222 (cinza) nos backgrounds |
| `src/components/whatsapp/WhatsAppContactPanel.tsx` | Editar e excluir notas inline |
| `src/components/whatsapp/WhatsAppInstances.tsx` | Modal editar conexao existente |
| `src/components/whatsapp/WhatsAppTemplates.tsx` | Modal editar template existente |
| `src/components/whatsapp/WhatsAppNewChat.tsx` | Normalizar telefone antes de criar |
| `supabase/functions/whatsapp-webhook/index.ts` | Melhorar normalizePhone para numeros sem DDI |

### Ordem de implementacao

1. Fix delete conversa (useWhatsApp.ts — CASCADE ja funciona)
2. Dark mode CSS (index.css)
3. Layout + area clicavel perfil (WhatsAppInbox.tsx)
4. Notas editar/excluir (WhatsAppContactPanel.tsx)
5. Editar conexao (WhatsAppInstances.tsx + useWhatsApp.ts)
6. Editar template (WhatsAppTemplates.tsx + useWhatsApp.ts)
7. Quick replies loading state (WhatsAppInbox.tsx)
8. Normalizacao telefone (webhook + NewChat)
