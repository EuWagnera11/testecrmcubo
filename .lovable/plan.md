

# 6 Correcoes: Templates Unificados, Seletor de Instancia, Duplicatas, Autoformato, Delete e Layout

## 1. Mover Respostas Rapidas para aba Templates do WhatsApp

**Situacao atual**: Existem 2 tabelas separadas (`quick_replies` e `whatsapp_templates`) e 2 interfaces separadas (`QuickRepliesManager` em Configuracoes e `WhatsAppTemplates` na aba Templates). O popover de atalhos rapidos no chat usa `quick_replies`.

**Solucao**: Unificar tudo na aba Templates do WhatsApp, usando a tabela `quick_replies` como fonte unica (pois tem campos mais completos: shortcut, use_count, variaveis).

**Mudancas**:

| Arquivo | Acao |
|---|---|
| `src/pages/WhatsApp.tsx` | Substituir `WhatsAppTemplates` por `QuickRepliesManager` na aba Templates |
| `src/pages/Settings.tsx` | Remover aba "Respostas Rapidas" e import de `QuickRepliesManager` |
| `src/components/whatsapp/WhatsAppInbox.tsx` | Atualizar texto "Crie em Configuracoes" para "Crie na aba Templates" no popover vazio |

A tabela `whatsapp_templates` e o componente `WhatsAppTemplates.tsx` ficam inalterados (podem ser removidos depois se desejado), mas nao serao mais referenciados.

---

## 2. Seletor de Instancia no modal Nova Conversa

**Arquivo**: `src/components/whatsapp/WhatsAppNewChat.tsx`

**Mudancas**:
- Remover prop `instanceId` fixa
- Adicionar `useWhatsAppInstances` para buscar instancias disponiveis
- Adicionar dropdown `Select` com instancias (filtrando `status = 'open'` se possivel)
- Campo obrigatorio — nao permitir iniciar sem selecionar instancia
- Usar `instanceId` selecionado ao enviar mensagem ou criar conversa

**Prop atualizada**: `WhatsAppNewChat` deixa de receber `instanceId` como prop; busca internamente.

**Ajuste no `WhatsAppInbox.tsx`**: Remover passagem de `instanceId` para `WhatsAppNewChat`.

---

## 3. Normalizacao de telefone (duplicatas)

**Problema real**: A funcao `normalizePhone` no `whatsapp-webhook` nao adiciona `55` para numeros locais (10-11 digitos), diferente do que ja foi corrigido anteriormente. O `whatsapp-send` tambem nao.

**Verificacao**: O webhook ja tem tratamento para numeros 10/11 digitos adicionando `55`. O `whatsapp-send` nao tem. O frontend `WhatsAppNewChat` tambem nao.

**Correcoes**:
- `supabase/functions/whatsapp-send/index.ts`: Adicionar tratamento para numeros sem DDI (10-11 digitos -> prefixar com 55)
- `src/components/whatsapp/WhatsAppNewChat.tsx`: Mesma logica de normalizacao no frontend

---

## 4. Autoformato de telefone no modal

**Arquivo**: `src/components/whatsapp/WhatsAppNewChat.tsx`

**Mudancas**:
- Criar funcao `formatPhoneBR(value)` que formata em tempo real para exibicao: `+55 (85) 9 9167-0420`
- Manter estado interno com digitos puros para envio
- `onChange`: extrair digitos, formatar, exibir
- `onSubmit`: usar digitos puros normalizados

---

## 5. Bug Delete no filtro "Todas"

**Analise**: O filtro "Todas" mostra conversas com `getConversationStatus` retornando `'all'` (bot ativo, nao resolvida). Essas conversas passam pelo mesmo `onDelete` handler que as outras. O problema nao esta no filtro em si, mas possivelmente na RLS.

**Solucao**: Verificar se `useDeleteConversation` esta usando `.select('id')` para detectar falhas de RLS. Ja esta implementado corretamente. Adicionar `console.log` temporario para debug e melhorar o toast de erro com detalhes especificos.

**Arquivo**: `src/hooks/useWhatsApp.ts` — garantir que o `deleteConversation` retorna erro claro.

---

## 6. Layout — filtros transbordando

**Arquivo**: `src/components/whatsapp/WhatsAppInbox.tsx`

**Mudancas nos filtros de status (linhas 222-246)**:
- Adicionar `overflow-x-auto` no container dos filtros
- Usar texto compacto com contadores inline: `"Todas"`, `"Aguardando (2)"`, `"Atendendo"`, `"Resolvidas"`
- Remover emojis dos labels dos filtros para economizar espaco
- Garantir `flex-shrink-0` em cada botao de filtro

**Mudancas no layout geral**:
- Sidebar: manter `w-80 lg:w-[320px]`
- Filtros: `flex gap-1 overflow-x-auto` com `scrollbar-hide`
- Container principal dos filtros: `min-w-0` para respeitar flex

---

## Secao Tecnica — Resumo de Arquivos

| Arquivo | Mudancas |
|---|---|
| `src/pages/WhatsApp.tsx` | Trocar WhatsAppTemplates por QuickRepliesManager na aba Templates |
| `src/pages/Settings.tsx` | Remover aba quick-replies e import |
| `src/components/whatsapp/WhatsAppNewChat.tsx` | Seletor de instancia, autoformato telefone, normalizacao |
| `src/components/whatsapp/WhatsAppInbox.tsx` | Texto popover vazio, layout filtros compacto com overflow, remover prop instanceId do NewChat |
| `src/hooks/useWhatsApp.ts` | Melhorar erro no deleteConversation |
| `supabase/functions/whatsapp-send/index.ts` | Adicionar normalizacao 10-11 digitos |

### Ordem de implementacao

1. Templates unificados (WhatsApp.tsx + Settings.tsx)
2. Nova Conversa com seletor de instancia + autoformato (WhatsAppNewChat.tsx)
3. Normalizacao telefone (whatsapp-send)
4. Layout filtros (WhatsAppInbox.tsx)
5. Delete debug (useWhatsApp.ts)

