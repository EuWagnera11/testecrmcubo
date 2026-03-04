

# Rodada 6 — Navegacao Imediata, Zoom-out, Atalhos Automaticos, Delete Hover e Auditoria

## 1. Nova Conversa — navegar imediatamente ao chat

**Arquivo**: `src/components/whatsapp/WhatsAppNewChat.tsx`

O componente precisa receber um callback `onConversationCreated(id)` para notificar o `WhatsAppInbox` sobre a nova conversa.

**Mudancas**:
- Adicionar prop `onConversationCreated?: (id: string) => void`
- No `handleSend`: apos insert/upsert bem-sucedido, extrair o `id` da conversa criada
- Chamar `onConversationCreated(id)` ANTES de fechar modal
- Fechar modal e limpar campos
- Loading state no botao "Iniciar" durante processo

**Arquivo**: `src/components/whatsapp/WhatsAppInbox.tsx`
- Passar callback para `WhatsAppNewChat`:
```text
<WhatsAppNewChat onConversationCreated={(id) => {
  setSelectedConversation(id);
  setShowChat(true);
}} />
```
- Invalidar queries de conversas para que a lista atualize em background

## 2. Zoom-out geral + preview ultima mensagem

**Arquivo**: `src/components/whatsapp/WhatsAppInbox.tsx`

Reducao de tamanhos em toda a interface:

| Elemento | Antes | Depois |
|---|---|---|
| Sidebar width | `w-80 lg:w-[320px]` | `w-[260px]` |
| Avatar | `h-10 w-10` | `h-8 w-8` |
| Nome texto | `text-sm` | `text-[13px]` |
| Timestamp | `text-[10px]` | `text-[10px]` (ok) |
| Item padding | `px-3 py-3` | `p-2` |
| Item gap | `gap-3` | `gap-2` |
| Chat header | `py-4` | `py-2`, header `h-12` |
| Chat header avatar | `h-9 w-9` | `h-8 w-8` |
| Baloes texto | `text-[15px]` | `text-[13px]`, `px-3` |
| Input area | `p-4` | `py-2 px-3` |
| Messages padding | `p-5` | `p-4` |
| Filtros | `text-[11px]` | `text-xs py-1 px-2` |

Preview da ultima mensagem ja existe via `last_message_preview`. Garantir truncamento com `max-w-[180px]`.

## 3. Atalhos — sugestao automatica ao digitar

**Arquivo**: `src/components/whatsapp/WhatsAppInbox.tsx` (ChatArea)

**Mudancas**:
- Adicionar estado `suggestion` no ChatArea: `const [suggestion, setSuggestion] = useState<QuickReply | null>(null)`
- No `handleInputChange`: verificar se o valor digitado bate exatamente com algum `shortcut` de `replies`
- Se bater: mostrar popup de sugestao ACIMA do input
- Tab ou Enter (quando sugestao visivel): aceitar sugestao, preencher input com conteudo (variaveis substituidas)
- Esc: dispensar sugestao
- Se usuario continuar digitando alem do atalho: sugestao desaparece
- Ao aceitar: chamar `incrementUseCount`

**Variaveis**: Usar `replaceVariables` existente com `contactContext` (nome, telefone, clinica)

**Layout do popup**:
```text
Acima do input, posicao absolute bottom-full:
[icone Zap] "atalho" -> Preview do conteudo (truncado)
Tab ou Enter para usar
```

**Logica de teclas**: Adicionar `onKeyDown` no Input:
- Se `suggestion` existe e tecla = Tab ou Enter: preventDefault, aplicar template
- Se tecla = Escape: setSuggestion(null)

## 4. Botao excluir — hover na lista (ja implementado, ajuste fino)

O botao de excluir ja existe com `opacity-0 group-hover:opacity-100`. Apenas ajustar:
- Posicao: `absolute right-2 top-1/2 -translate-y-1/2` em vez de inline
- Container do item: adicionar `relative`
- Confirmar funcionamento em todos os filtros (ja usa mesmo `onDelete` handler)

## 5. Auditoria geral

Verificar e corrigir silenciosamente:

**Console warning**: `WhatsAppInstances` — "Function components cannot be given refs". O componente renderiza multiplos `Dialog` no mesmo nivel. O warning vem de `Dialog` recebendo ref sem `forwardRef`. Solucao: envolver `WhatsAppInstances` em fragmento ou verificar se os Dialogs extras estao dentro de condicionais corretas.

**Dashboard hooks**: `useWhatsAppDashboardMetrics` — queries usam campos `is_bot_active`, `bot_paused_until`, `status`, `resolved_at` que existem no schema. OK.

**RLS**: Tabelas `quick_replies`, `whatsapp_contact_notes`, `whatsapp_instances` ja tem RLS com policies ALL para autenticados. OK.

**Edge Functions**: `whatsapp-webhook` e `whatsapp-send` ja tem `normalizePhone`. OK.

**Dark mode**: CSS ja corrigido para matiz neutra 222. OK.

---

## Secao Tecnica — Arquivos

| Arquivo | Mudancas |
|---|---|
| `src/components/whatsapp/WhatsAppNewChat.tsx` | Prop `onConversationCreated`, retornar id apos insert, loading state |
| `src/components/whatsapp/WhatsAppInbox.tsx` | Zoom-out (tamanhos menores), sugestao de atalho no input, callback NewChat, delete posicao absolute |
| `src/components/whatsapp/WhatsAppInstances.tsx` | Fix ref warning (minor) |

### Ordem de implementacao

1. WhatsAppNewChat — navegacao imediata com callback
2. WhatsAppInbox — zoom-out + sugestao atalho + delete hover refinado + callback
3. WhatsAppInstances — fix warning

