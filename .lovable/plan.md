

# Correcao de 4 Bugs Criticos no CRM WhatsApp

## Bug 1 — whatsapp-bot-update: Robustez contra payloads malformados

O erro "JSON parameter needs to be valid JSON" vem do n8n, nao da Edge Function. Porem, a Edge Function precisa ser mais robusta para aceitar payloads com campos vazios ou alternativos.

### Correcoes no `supabase/functions/whatsapp-bot-update/index.ts`:
- Envolver `req.json()` em try-catch separado com fallback para `req.text()` + parse manual
- Aceitar campos alternativos: `reply_text` OU `text` OU `message` OU `content`
- Se `reply_text` vier vazio mas existir em outro campo, usar o fallback
- Remover a validacao rigida que retorna 400 quando `reply_text` esta vazio — em vez disso, tentar extrair de campos alternativos primeiro
- Adicionar log detalhado do body recebido para debug

### Correcoes no n8n (instrucoes para o usuario):
- O erro "JSON parameter needs to be valid JSON" e causado pelas expressoes `{{ }}` do n8n que resolvem para strings vazias
- O body correto deve usar: `$('Enviar texto').first().json.data.message.conversation`
- Nao ha como corrigir isso via codigo — e configuracao do n8n

## Bug 2 — Dashboard mostra "Desconectado"

O Dashboard compara `inst.status === 'connected'`, mas o campo `status` na tabela `whatsapp_instances` armazena `'open'` (valor que vem da Evolution API), nao `'connected'`.

### Correcoes no `src/pages/Dashboard.tsx`:
- Linha 660: trocar `inst.status === 'connected'` para `inst.status === 'open'`
- Isso alinha com o que ja funciona corretamente na tela de Conexoes (`WhatsAppInstances.tsx` linha 174)

### Melhoria na tela de Conexoes (`WhatsAppInstances.tsx`):
- Adicionar estado de loading no botao "Verificar Status" com texto "Verificando..."
- Contador de tentativas: apos 3 falhas consecutivas, mostrar toast com "Falha ao conectar. Verifique a configuracao."
- Atualizar o status da instancia no banco apos verificacao bem-sucedida

## Bug 3 — Fallback quando whatsapp-bot-update falha

Quando o n8n envia payload invalido, a mensagem do bot nao e salva no CRM. Isso quebra notificacoes e pipeline.

### Correcoes no `supabase/functions/whatsapp-bot-update/index.ts`:
- Mesmo com payload parcialmente invalido, salvar a mensagem com o que estiver disponivel
- Se `reply_text` estiver vazio apos todos os fallbacks, salvar com content = "[Mensagem do bot nao capturada]"
- Sempre retornar `{ ok: true }` com campo `warning` se houve fallback, em vez de 400
- Isso garante que o Supabase Realtime dispara o evento e as notificacoes funcionam

## Bug 4 — "Tipo CRM: desconhecido" no resumo

Esse campo vem do n8n (node "Construir Contexto"), nao do CRM. Nao ha como corrigir via codigo do CRM.

### O que podemos fazer no CRM:
- No `whatsapp-bot-update`, se o campo `ai_summary` contiver "desconhecido" ou "Tipo CRM: desconhecido", limpar/remover essa parte antes de salvar
- Usar regex para sanitizar: `ai_summary.replace(/Tipo CRM:\s*desconhecido[,;\s]*/gi, '')`

### Instrucoes para o n8n (para o usuario):
- No node "Construir Contexto", adicionar logica para remover `clientData.tipo` quando igual a "desconhecido"

---

## Secao Tecnica

### Arquivos modificados

| Arquivo | Mudanca |
|---|---|
| `supabase/functions/whatsapp-bot-update/index.ts` | Try-catch no parse, fallback de campos, sanitizacao ai_summary |
| `src/pages/Dashboard.tsx` | Corrigir comparacao de status: `'open'` em vez de `'connected'` |
| `src/components/whatsapp/WhatsAppInstances.tsx` | Loading state no botao status, retry com contador |

### Resumo das mudancas por bug

**Bug 1**: Edge Function aceita payloads flexiveis (campos alternativos, fallback para texto vazio)
**Bug 2**: Dashboard usa `status === 'open'` (1 linha corrigida)
**Bug 3**: Mensagem sempre salva mesmo com payload parcial (fallback "[Mensagem do bot nao capturada]")
**Bug 4**: Sanitizacao automatica do ai_summary removendo "Tipo CRM: desconhecido"

