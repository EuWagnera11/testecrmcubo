

# Conectar respostas do Agente IA (n8n) ao CRM

## Problema

Quando o agente IA no n8n responde uma mensagem, ele envia direto pela Evolution API. A Evolution API nem sempre dispara um evento `messages.upsert` com `fromMe: true` para mensagens enviadas via API, entao a resposta do bot nunca chega ao webhook do CRM -- por isso nao aparece no chat.

## Solucao

Criar uma nova Edge Function (`whatsapp-bot-update`) que o n8n chama logo apos enviar a resposta do agente. Essa funcao salva a mensagem do bot no banco e, opcionalmente, o resumo da conversa. No n8n, basta adicionar um node HTTP Request apos o "Enviar texto".

## Etapas

### 1. Migracoes de banco (schema)

Adicionar campos na tabela `whatsapp_conversations` para suportar resumo IA e controle do bot:
- `ai_summary` (TEXT) -- resumo gerado pelo agente
- `ai_summary_at` (TIMESTAMPTZ) -- quando foi atualizado
- `is_bot_active` (BOOLEAN DEFAULT true) -- se o bot esta respondendo
- `last_message_preview` (TEXT) -- preview da ultima mensagem na lista

### 2. Nova Edge Function: `whatsapp-bot-update`

Endpoint publico (autenticado via apikey da Evolution no header) que o n8n chama apos o agente responder:

```text
POST /functions/v1/whatsapp-bot-update
Body: {
  "instance_name": "agencia-suporte",
  "phone": "558591670420",
  "reply_text": "Ola! Sou o Andre...",
  "ai_summary": "Lead interessado em plano Growth...",  // opcional
  "is_bot_active": true  // opcional
}
```

A funcao:
- Localiza o contato pelo phone e a instancia pelo instance_name
- Localiza (ou cria) a conversa
- Insere a mensagem com `sender_type: "bot"`
- Atualiza `ai_summary`, `last_message_preview` e `is_bot_active` na conversa

### 3. Atualizar webhook para salvar preview

Ao processar mensagens recebidas, salvar `last_message_preview` com os primeiros 100 caracteres.

### 4. Atualizar o chat no CRM (WhatsAppInbox)

- Mensagens com `sender_type: "bot"` aparecem com visual diferente (icone de robo, cor roxa)
- Mostrar `last_message_preview` na lista de conversas
- Mostrar badge "Bot ativo" no header do chat
- Botao "Assumir conversa" que desativa o bot e atribui ao usuario
- Painel lateral com o resumo IA quando disponivel

### 5. Configuracao no n8n (pelo usuario)

Apos o deploy, adicionar um node **HTTP Request** no workflow do n8n, logo depois do "Enviar texto":

```text
Method: POST
URL: https://ognblcupazzctxxhsyau.supabase.co/functions/v1/whatsapp-bot-update
Headers:
  Content-Type: application/json
  apikey: (anon key do projeto)
Body:
  {
    "instance_name": "agencia-suporte",
    "phone": "{{ $('Normalizar Entrada').first().json.phone }}",
    "reply_text": "{{ $('Pos-Agente').first().json.replyText }}",
    "ai_summary": "{{ resumo se disponivel }}"
  }
```

---

## Secao Tecnica

### Arquivos a criar/modificar

| Arquivo | Acao |
|---|---|
| Migracao SQL | Adicionar colunas `ai_summary`, `ai_summary_at`, `is_bot_active`, `last_message_preview` em `whatsapp_conversations` |
| `supabase/functions/whatsapp-bot-update/index.ts` | Nova Edge Function |
| `supabase/config.toml` | Adicionar entry para `whatsapp-bot-update` com `verify_jwt = false` |
| `supabase/functions/whatsapp-webhook/index.ts` | Salvar `last_message_preview` na conversa |
| `src/hooks/useWhatsApp.ts` | Atualizar tipos, adicionar hook de handoff |
| `src/components/whatsapp/WhatsAppInbox.tsx` | Visual do bot, preview, resumo, handoff |

### Fluxo completo apos implementacao

```text
Cliente envia msg
       |
       v
Evolution API --> webhook CRM (salva msg + forward n8n)
                                   |
                                   v
                              n8n processa
                                   |
                                   v
                          Agente IA responde
                                   |
                        +----------+----------+
                        |                     |
                        v                     v
                  Enviar texto          whatsapp-bot-update
                  (Evolution API)       (salva no CRM)
                        |
                        v
                  Cliente recebe
```

