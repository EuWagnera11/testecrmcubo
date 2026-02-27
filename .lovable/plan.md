

# Corrigir recebimento de mensagens no Inbox do WhatsApp

## Problema identificado

O Inbox do CRM nao recebe mensagens porque o webhook nunca foi configurado de verdade na Evolution API. A acao `set-webhook` na Edge Function esta retornando uma mensagem fixa "Webhook ja configurado" sem realmente chamar a API da Evolution para registrar o webhook. Ou seja, a Evolution API nao sabe para onde enviar as mensagens recebidas.

Alem disso, ha codigo morto apos o `return` da acao `set-webhook` (linhas 394-398) que referencia uma variavel `result` inexistente.

## Solucao

### 1. Corrigir a acao `set-webhook` na Edge Function `whatsapp-instance`

Atualmente (linhas 383-398):
```text
if (action === "set-webhook") {
  return new Response(JSON.stringify({ 
    success: true, 
    message: "Webhook ja configurado: https://n8n.refinecubo.com.br/..."
  }));
}
  // codigo morto com 'result' indefinido
```

Deve ser substituido por uma chamada real a Evolution API no endpoint `POST /webhook/set/{instanceName}` com o body:
```text
{
  "url": "https://ognblcupazzctxxhsyau.supabase.co/functions/v1/whatsapp-webhook",
  "webhook_by_events": false,
  "webhook_base64": false,
  "events": ["MESSAGES_UPSERT"]
}
```

Isso faz a Evolution API enviar todas as mensagens recebidas para a Edge Function `whatsapp-webhook` do projeto, que ja existe e processa corretamente as mensagens (cria contato, conversa e insere mensagem no banco).

### 2. Encaminhar para n8n (opcional, sem perder integracao existente)

Como o usuario mencionou que usa `https://n8n.refinecubo.com.br/webhook/webhook-evolution` no n8n e funciona, a Edge Function `whatsapp-webhook` pode encaminhar o payload recebido para o n8n apos processar. Assim ambos (CRM e n8n) recebem as mensagens.

### 3. Remover codigo morto

Remover as linhas 394-398 que estao apos o `return` e referenciam `result` indefinido.

## Secao Tecnica

### Arquivo a modificar
- `supabase/functions/whatsapp-instance/index.ts` - corrigir acao `set-webhook` (linhas 383-398)
- `supabase/functions/whatsapp-webhook/index.ts` - adicionar forward para n8n

### Mudanca no whatsapp-instance/index.ts

Substituir o bloco `set-webhook` (linhas 383-398) por:

```text
if (action === "set-webhook") {
  const webhookUrl = Deno.env.get("SUPABASE_URL") + "/functions/v1/whatsapp-webhook";
  
  const result = await callEvolutionApi({
    apiUrl: evolutionApiUrl,
    apiKey: evolutionApiKey,
    path: `/webhook/set/${instanceName}`,
    method: "POST",
    body: {
      url: webhookUrl,
      webhook_by_events: false,
      webhook_base64: false,
      events: ["MESSAGES_UPSERT"],
    },
  });

  return new Response(JSON.stringify({ success: true, data: result, webhook_url: webhookUrl }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

### Mudanca no whatsapp-webhook/index.ts

Apos processar a mensagem no banco, encaminhar o payload original para o n8n:

```text
// Forward to n8n (fire-and-forget)
try {
  fetch("https://n8n.refinecubo.com.br/webhook/webhook-evolution", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
} catch {}
```

### Resultado esperado
- Ao clicar "Configurar Webhook" no CRM, a Evolution API registra o webhook apontando para o backend do projeto
- Mensagens recebidas no WhatsApp aparecem automaticamente no Inbox do CRM
- O n8n continua recebendo os mesmos eventos via forward
- Envio de mensagens continua funcionando normalmente

