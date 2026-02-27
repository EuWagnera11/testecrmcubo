

# Adicionar Config Manual de Backend no modulo WhatsApp

## Resumo
Adicionar na aba "Conexoes" do WhatsApp um painel de configuracao onde o usuario pode informar a URL e chave de um backend alternativo. Essas credenciais sao salvas no localStorage e usadas em todas as chamadas de Edge Functions do modulo WhatsApp (QR Code, Status, Webhook, envio de mensagens).

## O que existe hoje
- O modulo WhatsApp ja tem: formulario de Nova Conexao, lista de conexoes com badges de status, botoes de acao (QR Code, Status, Webhook, Deletar).
- Todas as chamadas usam `supabase.functions.invoke()` que aponta para o backend do Lovable Cloud (`ognblcupazzctxxhsyau`).
- A UI ja atende a maioria dos requisitos listados (cards, badges, toasts, mobile-friendly).

## O que sera adicionado

### 1. Painel de Configuracao de Backend (topo da aba Conexoes)
- Card com dois campos: **URL do Backend** e **Chave Anonima**
- Valores padrao: `https://jdedyngozlmdjldhxwkw.supabase.co` e a chave informada
- Botao "Salvar" que persiste no `localStorage` (`WA_SUPABASE_URL` e `WA_SUPABASE_ANON_KEY`)
- Indicador visual (badge verde/vermelho) mostrando se esta configurado
- Botao "Resetar" para voltar ao backend padrao do projeto

### 2. Hook utilitario `useWhatsAppBackend`
- Novo hook que le os valores do localStorage
- Retorna funcao `callFunction(functionName, body)` que faz `fetch` direto na URL configurada (em vez de `supabase.functions.invoke`)
- Validacao: se chave nao estiver configurada, lanca erro com mensagem amigavel

### 3. Atualizar chamadas no WhatsAppInstances.tsx
- `handleCheckStatus`, `handleGetQR`, `handleSetWebhook` passam a usar o hook `useWhatsAppBackend` em vez de `supabase.functions.invoke`
- Toast de aviso se o backend nao estiver configurado

### 4. Atualizar chamadas no useWhatsApp.ts
- `useSendWhatsAppMessage` tambem passa a usar o backend configuravel
- As queries de dados (conversas, mensagens, templates, instancias) continuam no backend do projeto (dados ficam aqui)

### 5. QR Code em Modal (melhoria)
- Em vez de abrir em nova janela, mostrar o QR Code em um Dialog/Modal dentro da propria tela
- Auto-refresh a cada 15 segundos

## Secao Tecnica

### Arquivos a criar
- `src/hooks/useWhatsAppBackend.ts` - hook para gerenciar URL/key do localStorage e fazer chamadas

### Arquivos a modificar
- `src/components/whatsapp/WhatsAppInstances.tsx` - adicionar painel de config no topo + modal de QR Code + usar novo hook
- `src/hooks/useWhatsApp.ts` - atualizar `useSendWhatsAppMessage` para usar backend configuravel

### Logica do hook useWhatsAppBackend
```text
function useWhatsAppBackend():
  url = localStorage.get('WA_SUPABASE_URL') || default
  key = localStorage.get('WA_SUPABASE_ANON_KEY') || ''
  
  callFunction(name, body):
    if !key: throw "Configure o backend primeiro"
    fetch(url + '/functions/v1/' + name, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, Content-Type: 'application/json' },
      body: JSON.stringify(body)
    })
  
  return { url, key, setConfig, clearConfig, callFunction, isConfigured }
```

### Fluxo do usuario
1. Acessa WhatsApp > Conexoes
2. Ve o painel "Configuracao do Backend" no topo
3. Cola a URL e chave do backend desejado
4. Clica "Salvar" - valores persistem no localStorage
5. Todas as acoes (QR Code, Status, etc.) passam a chamar o backend configurado
6. Dados das conversas/mensagens continuam no banco do projeto atual
