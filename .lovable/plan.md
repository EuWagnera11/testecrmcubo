

# Corrigir CORS removendo backend manual e usando Lovable Cloud

## Problema
O modulo WhatsApp esta chamando Edge Functions em um projeto Supabase externo (`jdedyngozlmdjldhxwkw.supabase.co`) via `fetch` direto. Isso causa erro de CORS porque esse servidor externo nao permite requests do dominio `testecrmcubo.lovable.app`. As Edge Functions ja estao deployadas no Lovable Cloud deste projeto -- basta usa-las diretamente.

## Solucao
Remover o hook `useWhatsAppBackend` e o painel de configuracao manual. Todas as chamadas passam a usar `supabase.functions.invoke()` do client nativo, que ja aponta para o Lovable Cloud correto e nao tem problemas de CORS.

## Alteracoes

### 1. Remover `src/hooks/useWhatsAppBackend.ts`
- Arquivo inteiro sera removido (nao e mais necessario)

### 2. Atualizar `src/components/whatsapp/WhatsAppInstances.tsx`
- Remover import do `useWhatsAppBackend`
- Remover todo o card "Configuracao do Backend" (linhas 134-182)
- Remover estados `configUrl`, `configKey`
- Remover funcoes `handleSaveConfig`, `handleResetConfig`
- Alterar `handleCheckStatus`, `handleGetQR`, `handleSetWebhook` e `fetchQR` para usar `supabase.functions.invoke('whatsapp-instance', { body: {...} })` em vez de `callFunction`
- Remover verificacao `isConfigured` (sempre configurado via Lovable Cloud)

### 3. Atualizar `src/hooks/useWhatsApp.ts`
- Remover import do `useWhatsAppBackend`
- Em `useSendWhatsAppMessage`, trocar `callFunction('whatsapp-send', ...)` por `supabase.functions.invoke('whatsapp-send', { body: {...} })`

### Resultado
- Zero CORS errors (chamadas passam pelo mesmo dominio)
- Sem configuracao manual necessaria
- Edge Functions do Lovable Cloud usadas diretamente
- A Evolution API URL e API Key continuam vindo da tabela `whatsapp_instances` (lidos pela Edge Function no servidor)

