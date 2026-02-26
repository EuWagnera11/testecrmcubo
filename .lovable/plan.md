

## Corrigir conexão com Evolution API

### Problema
A backend function `whatsapp-instance` falha ao conectar com `evoapi.refinecubo.com.br` por dois motivos:
1. **HTTPS direto** falha com erro de certificado SSL (`CaUsedAsEndEntity`)
2. **HTTP** recebe redirect 301/308 para HTTPS, mas a função trata redirecionamentos como erro

### Solucao
Modificar a funcao `whatsapp-instance` para **seguir os redirecionamentos automaticamente** em vez de usar `redirect: "manual"`, e manter o `unsafelyIgnoreCertificateErrors` para lidar com o certificado problematico do servidor Evolution.

### Mudancas tecnicas

**Arquivo:** `supabase/functions/whatsapp-instance/index.ts`

1. Remover `redirect: "manual"` do fetch para permitir que redirecionamentos sejam seguidos automaticamente
2. Remover a verificacao de status 301/302/307/308 (nao sera mais necessaria pois o fetch seguira automaticamente)
3. Garantir que o `Deno.createHttpClient` com `unsafelyIgnoreCertificateErrors` seja passado corretamente para que o fetch consiga completar a conexao HTTPS apos o redirect
4. Simplificar `getBaseCandidates` para tentar apenas HTTP primeiro (ja que o servidor redireciona para HTTPS automaticamente), reduzindo tentativas desnecessarias

Isso vai resolver o erro "Erro ao buscar QR Code" que aparece na tela.

