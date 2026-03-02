

# 5 Correcoes e Melhorias: Dark Mode, Nova Conversa, Atalhos, Layout e Duplicatas

## 1. Dark/Light Mode Toggle no Header

O hook `useTheme` ja existe e funciona perfeitamente (localStorage + sync com perfil + prefers-color-scheme). O Tailwind ja esta configurado com `darkMode: ["class"]` e variaveis CSS dark ja existem em `index.css`.

**Mudanca**: Adicionar botao toggle no `Header.tsx` entre NotificationDropdown e avatar.

**Arquivo**: `src/components/layout/Header.tsx`
- Importar `useTheme` e icones `Moon`/`Sun`
- Adicionar botao que alterna entre light/dark/system
- Click simples: toggle light <-> dark
- Tooltip mostrando estado atual

---

## 2. Simplificar Modal "Nova Conversa"

**Arquivo**: `src/components/whatsapp/WhatsAppNewChat.tsx`
- Remover import de `useWhatsAppTemplates` e `Select` components
- Remover bloco do template selector (linhas 53-67)
- Tornar mensagem opcional: se vazia, criar conversa sem enviar
- Alterar validacao: exigir apenas telefone
- Se mensagem vazia, criar contato + conversa via Supabase direto (sem chamar whatsapp-send)
- Se mensagem preenchida, enviar via `sendMessage.mutateAsync` como hoje
- Normalizar telefone antes de salvar
- Botao "Iniciar" em vez de "Enviar"

---

## 3. Respostas Rapidas — comportamento correto

**Arquivo**: `src/components/whatsapp/WhatsAppInbox.tsx`
- Remover logica de detecao de "/" no `handleInputChange` (linhas 513-519)
- Remover estado `slashFilter` e `filteredReplies` baseado nele
- Remover bloco "Slash autocomplete" do JSX (linhas 676-690)
- Manter apenas o Popover do botao Zap que ja funciona corretamente (abre lista, clica, preenche campo)
- Trocar placeholder "Digite / para atalhos..." por "Digite uma mensagem"

---

## 4. Layout Input — botoes a esquerda

**Arquivo**: `src/components/whatsapp/WhatsAppInbox.tsx`
- Reorganizar o form de input (linhas 693-741):

```text
Layout novo: [Zap] [Send] [Input campo largo]
```

- Mover Popover do Zap para antes do Input
- Mover botao Send para antes do Input
- Input continua com `flex-1`

---

## 5. Bug de duplicacao de contato — normalizar telefone

### 5a. Funcao normalizePhone nas Edge Functions

Criar funcao utilitaria que:
- Remove tudo que nao e digito
- Remove sufixos `@s.whatsapp.net` / `@c.us`
- Detecta e remove `55` duplicado no inicio (ex: `555585...` -> `5585...`)
- Retorna apenas digitos normalizados

### 5b. Aplicar em 3 lugares

**`supabase/functions/whatsapp-webhook/index.ts`** (linha 44):
- Trocar `const phone = remoteJid.split("@")[0]` por `normalizePhone(remoteJid)`

**`supabase/functions/whatsapp-send/index.ts`** (linha 101):
- Aplicar `normalizePhone(phone)` antes do upsert de contato

**`src/components/whatsapp/WhatsAppNewChat.tsx`**:
- Aplicar normalizacao no frontend antes de enviar

### 5c. Migracao para corrigir duplicatas existentes

Migracao SQL que:
- Identifica contatos com telefones que se normalizam para o mesmo valor
- Mantem o mais antigo (menor `created_at`)
- Migra conversas e mensagens do duplicado para o original
- Deleta o contato duplicado

```sql
-- Identificar e corrigir duplicatas de contatos
-- Normaliza removendo 55 duplicado no inicio
WITH normalized AS (
  SELECT id, phone, created_at,
    CASE
      WHEN phone ~ '^55\d{12,13}$' AND substring(phone from 3 for 2) = '55'
        THEN '55' || substring(phone from 5)
      ELSE phone
    END AS norm_phone
  FROM whatsapp_contacts
),
dupes AS (
  SELECT norm_phone, 
    array_agg(id ORDER BY created_at ASC) AS ids,
    count(*) AS cnt
  FROM normalized
  GROUP BY norm_phone
  HAVING count(*) > 1
)
SELECT * FROM dupes;
-- Manual review before executing deletes
```

Um botao "Corrigir duplicatas" nao sera adicionado na UI neste momento — a correcao sera feita via migracao SQL unica + prevencao nas Edge Functions.

---

## Secao Tecnica — Resumo de Arquivos

| Arquivo | Mudancas |
|---|---|
| `src/components/layout/Header.tsx` | Toggle dark/light mode com useTheme |
| `src/components/whatsapp/WhatsAppNewChat.tsx` | Remover templates, mensagem opcional, normalizar telefone |
| `src/components/whatsapp/WhatsAppInbox.tsx` | Remover slash autocomplete, trocar placeholder, layout botoes esquerda |
| `supabase/functions/whatsapp-webhook/index.ts` | normalizePhone no parse do JID |
| `supabase/functions/whatsapp-send/index.ts` | normalizePhone no upsert de contato |
| Migracao SQL | Corrigir duplicatas existentes |

### Ordem de implementacao

1. Header toggle (independente)
2. WhatsAppNewChat simplificado (independente)
3. WhatsAppInbox (slash removal + layout)
4. Edge Functions (normalizePhone)
5. Migracao SQL (duplicatas)

