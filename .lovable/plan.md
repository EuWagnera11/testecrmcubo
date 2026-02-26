
Objetivo
Resolver a falha da backend function `whatsapp-instance` no botão “QR Code”, eliminando o erro `invalid peer certificate: CaUsedAsEndEntity` com uma estratégia robusta que combine as duas opções que você sugeriu (priorizando a que funcionar em runtime).

Diagnóstico encontrado
- O fluxo de Conexões chama `whatsapp-instance` com ações:
  - `check-status`
  - `get-qrcode`
  - `set-webhook`
- O erro atual ocorre dentro de `callEvolutionApi`, ao tentar acessar `https://evoapi.refinecubo.com.br/...`.
- Mesmo iniciando por `http://`, o request está sendo redirecionado para `https://`, e aí quebra no TLS.
- Hoje a function usa `unsafelyIgnoreCertificateErrors` por hostname, mas isso não está resolvendo no runtime atual.
- Observação importante de dados: neste projeto não existe `public.whatsapp_settings`; o módulo atual usa `public.whatsapp_instances` (inclusive no frontend e nas backend functions).

Plano de implementação
1) Reforçar o client TLS inseguro de forma explícita no `fetch` (Opção 1)
- No `callEvolutionApi`, criar um `httpClient` com:
  - `Deno.createHttpClient({ unsafelyIgnoreCertificateErrors: true })`
- Passar sempre explicitamente no `fetch`:
  - `fetch(url, { client: httpClient, ...options })`
- Remover uso condicional/spread para evitar qualquer ambiguidade no runtime.
- Fechar o client em `finally` para evitar vazamento de recurso.

2) Forçar tentativa HTTP antes de HTTPS e controlar redirecionamento (Opção 2 com fallback)
- Ajustar geração de URLs candidatas para testar em ordem:
  1. URL forçada em `http://...`
  2. URL original normalizada
- Para a tentativa HTTP, controlar redirect para não “escapar” automaticamente para HTTPS sem tratamento.
- Se vier `Location` com `https://`, reescrever para `http://` e tentar mais uma vez.
- Se ainda falhar, seguir para próxima estratégia e registrar logs claros por tentativa.

3) Melhorar observabilidade e erro final
- Padronizar logs por tentativa (`método`, `url`, `status`, `motivo da falha`).
- Retornar erro final consolidado, informando claramente quando todas as estratégias falharem por TLS.
- Manter parse de payload de erro da Evolution para facilitar diagnóstico em produção.

4) Garantir compatibilidade com as 3 ações existentes
- Validar que as mudanças em `callEvolutionApi` não quebram:
  - `get-qrcode`
  - `check-status`
  - `set-webhook`

Validação após implementação
- Teste funcional na UI:
  1. Conexões → clicar “QR Code”
  2. Conexões → “Verificar Status”
  3. Conexões → “Configurar Webhook”
- Critérios de sucesso:
  - Não aparecer mais `Edge Function returned a non-2xx status code` por `CaUsedAsEndEntity`.
  - QR Code ou pairing code retornar normalmente.
  - Logs da function sem erro de certificado nas tentativas que concluírem.

Riscos e tratamento
- Se o servidor remoto forçar HTTPS e o runtime realmente ignorar `unsafelyIgnoreCertificateErrors` mesmo explícito:
  - manteremos fallback HTTP + controle de redirect;
  - se ainda assim falhar, a function passará a retornar diagnóstico objetivo para ação no servidor Evolution (cadeia SSL inválida).
- Isso evita erro genérico e deixa claro o próximo passo técnico.

Se você aprovar, eu implemento exatamente essa correção no `supabase/functions/whatsapp-instance/index.ts` e em seguida valido o fluxo completo de QR Code/conexão.
