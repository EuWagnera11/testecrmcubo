

# Corrigir erro "webhook requires property enabled"

## Problema
Os logs da Edge Function mostram claramente o erro retornado pela Evolution API:
```
Evolution API [400]: webhook requires property "enabled"
```

O body enviado para `/webhook/set/{instanceName}` esta faltando a propriedade `enabled: true` dentro do objeto `webhook`.

## Solucao

Adicionar `enabled: true` ao objeto `webhook` no body da requisicao (linha 393 do arquivo `supabase/functions/whatsapp-instance/index.ts`).

## Secao Tecnica

### Arquivo: `supabase/functions/whatsapp-instance/index.ts`

Alterar o bloco nas linhas 391-398 de:

```text
body: {
  webhook: {
    url: webhookUrl,
    webhook_by_events: false,
    webhook_base64: false,
    events: ["MESSAGES_UPSERT"],
  },
},
```

Para:

```text
body: {
  webhook: {
    enabled: true,
    url: webhookUrl,
    webhook_by_events: false,
    webhook_base64: false,
    events: ["MESSAGES_UPSERT"],
  },
},
```

Uma unica linha adicionada. Deploy automatico.
