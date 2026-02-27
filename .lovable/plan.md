

# 10 Correcoes Criticas + Melhorias UX no WhatsApp CRM

## Correcao 1 — Bot mensagem vazia "[Mensagem do bot nao capturada]"

**Problema**: Os logs mostram `reply_text: ""` vindo do n8n. O fallback atual salva `"[Mensagem do bot nao capturada]"` que e confuso para o usuario.

**Solucao**: No `whatsapp-bot-update/index.ts`, quando `reply_text` esta vazio mas `ai_summary` tem conteudo, usar o `ai_summary` como texto da mensagem. Caso contrario, usar fallback amigavel `"Mensagem enviada pelo bot"` (sem colchetes).

```text
Prioridade de texto:
1. reply_text (se nao vazio)
2. text / message / content (campos alternativos)
3. ai_summary (como ultimo recurso antes do fallback)
4. "Mensagem enviada pelo bot" (fallback limpo)
```

**Arquivo**: `supabase/functions/whatsapp-bot-update/index.ts`

---

## Correcao 2 — Filtro "Aguardando" sempre mostra 0

**Problema**: A funcao `getConversationStatus()` no frontend retorna `'all'` para conversas com bot ativo. Conversas com `is_bot_active = false` mas sem `bot_paused_until` (ex: handoff manual) nao sao capturadas.

**Solucao**: Ajustar a logica para considerar qualquer conversa com `is_bot_active = false` e status diferente de `'resolved'` como "waiting" (se sem assigned_to) ou "attending" (se com assigned_to), independente de `bot_paused_until`.

**Arquivo**: `src/components/whatsapp/WhatsAppInbox.tsx` (funcao `getConversationStatus`)

---

## Correcao 3 — Sem botao "Excluir conversa"

**Solucao**: Adicionar hook `useDeleteConversation` em `useWhatsApp.ts` que deleta mensagens + conversa. Adicionar icone de lixeira em cada item da lista de conversas com dialog de confirmacao.

**Arquivos**: `src/hooks/useWhatsApp.ts`, `src/components/whatsapp/WhatsAppInbox.tsx`

---

## Correcao 4 — Instancia sempre "Desconectado"

**Problema**: O status so atualiza quando o usuario clica "Verificar Status" manualmente. O campo `status` no banco pode estar desatualizado.

**Solucao**: Adicionar `refetchInterval: 60000` na query de instancias para recarregar automaticamente. No `handleCheckStatus`, ja atualiza o banco (isso ja funciona). Adicionar auto-check ao montar o componente de instancias.

**Arquivo**: `src/hooks/useWhatsApp.ts` (useWhatsAppInstances), `src/components/whatsapp/WhatsAppInstances.tsx`

---

## Correcao 5 — Templates nao aparecem nos atalhos

**Problema**: `useQuickReplies` nao tem `refetchInterval`, entao novos templates so aparecem ao recarregar a pagina.

**Solucao**: Adicionar `refetchInterval: 30000` na query de `quick_replies`.

**Arquivo**: `src/hooks/useQuickReplies.ts`

---

## Correcao 6 — Badge roxa no avatar do contato (remover)

**Problema**: Na lista de conversas, o avatar mostra um icone de Bot roxo quando `is_bot_active = true`. Isso e confuso pois o label "Bot" ja aparece nas mensagens.

**Solucao**: Remover o badge do avatar na lista de conversas (linhas 322-326 do ConversationItem).

**Arquivo**: `src/components/whatsapp/WhatsAppInbox.tsx`

---

## Correcao 7 — Layout do input: botao Zap sobrepondo

**Problema**: O botao de atalhos rapidos (Zap) fica ao lado esquerdo do input, empurrando o layout.

**Solucao**: Reorganizar o layout do input para: `[Input grande] [Zap] [Enviar]`. Mover o botao Zap para depois do input. Adicionar loading spinner no botao Enviar durante o envio.

**Arquivo**: `src/components/whatsapp/WhatsAppInbox.tsx`

---

## Correcao 8 — Filtros somem quando abre conversa (mobile)

**Problema**: No mobile, ao selecionar uma conversa, a lista (com filtros) fica `hidden`. Ao voltar, os filtros estao la, mas o estado do filtro pode ter sido resetado.

**Solucao**: Garantir que `statusFilter` persiste ao navegar entre conversas. Os filtros ja sao sticky no topo do painel de lista, mas adicionar `sticky top-0 z-10 bg-background` para garantir visibilidade durante scroll.

**Arquivo**: `src/components/whatsapp/WhatsAppInbox.tsx`

---

## Correcao 9 — Performance: mensagens demoram >5s

**Solucao**: 
- Adicionar `isPending` visual no botao Enviar (spinner)
- Otimistic update: adicionar mensagem na lista local antes da resposta do servidor
- Timeout de 10s com toast de erro e opcao de retry

**Arquivo**: `src/components/whatsapp/WhatsAppInbox.tsx`

---

## Correcao 10 — Pipeline nao conectado ao WhatsApp

**Problema**: Resolver uma conversa nao cria/move lead no pipeline automaticamente.

**Solucao**: Na funcao `handleResolve`, apos resolver a conversa, verificar se ja existe um lead no pipeline com o telefone do contato. Se nao existir, criar um novo. Se existir, mover para o stage adequado. Isso sera feito no frontend (nao precisa de trigger SQL).

**Arquivo**: `src/components/whatsapp/WhatsAppInbox.tsx`

---

## Secao Tecnica - Resumo de Arquivos

| Arquivo | Mudancas |
|---|---|
| `supabase/functions/whatsapp-bot-update/index.ts` | Fallback inteligente: usar ai_summary como texto, fallback limpo |
| `src/components/whatsapp/WhatsAppInbox.tsx` | Filtro aguardando corrigido, excluir conversa, layout input, remover badge avatar, loading envio, sticky filtros, pipeline integration |
| `src/hooks/useWhatsApp.ts` | Hook deleteConversation, refetchInterval instancias |
| `src/hooks/useQuickReplies.ts` | refetchInterval: 30000 |

### Ordem de implementacao

1. Edge Function (correcao 1 - bot mensagem)
2. Hook useWhatsApp (correcoes 3, 4)
3. Hook useQuickReplies (correcao 5)
4. WhatsAppInbox (correcoes 2, 6, 7, 8, 9, 10 - tudo junto)

