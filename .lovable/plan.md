

# WhatsApp Multi-Instancia: SDR Sarah, SDR Vitoria e CUBO Oficial

## Problema Atual
O inbox do WhatsApp atualmente usa apenas a **primeira instancia** cadastrada (`instances?.[0]?.id`), ignorando todas as outras. Nao existe forma de alternar entre contas diferentes.

## Solucao
Adicionar um **seletor de instancias** na lateral esquerda do inbox, permitindo alternar entre as 3 contas de WhatsApp. Cada instancia mostrara suas proprias conversas e mensagens de forma independente.

## Como Vai Funcionar

1. **Barra de instancias** no topo da lista de conversas com abas/chips coloridos para cada conta:
   - SDR Sarah (com indicador de cor)
   - SDR Vitoria (com indicador de cor)
   - CUBO Oficial (com indicador de cor diferenciado)

2. **Badge de nao-lidas por instancia** - cada aba mostrara o total de mensagens nao lidas daquela conta

3. **Troca rapida** - ao clicar em outra instancia, a lista de conversas atualiza automaticamente

4. **Inbox unificado (opcional)** - opcao "Todas" para ver conversas de todas as instancias juntas

## Mudancas Tecnicas

### 1. `WhatsAppInbox.tsx` - Seletor de instancias
- Substituir `instances?.[0]?.id` por um estado `activeInstanceId` controlado pelo usuario
- Renderizar abas/chips para cada instancia cadastrada com nome e contagem de nao-lidas
- Adicionar opcao "Todas" que carrega conversas sem filtro de instancia
- Mostrar indicador visual de qual instancia esta ativa

### 2. `useWhatsApp.ts` - Hook de conversas com contagem
- Criar novo hook `useWhatsAppUnreadCounts` que retorna o total de nao-lidas por instancia (para os badges)

### 3. `WhatsAppInbox.tsx` - Indicador de instancia nas conversas
- Quando em modo "Todas", mostrar um badge colorido em cada conversa indicando de qual instancia ela pertence (Sarah, Vitoria, CUBO)

### 4. Cabecalho do chat
- Mostrar o nome da instancia/conta no header do chat para o agente saber por qual numero esta respondendo

Nenhuma mudanca no banco de dados e necessaria - a tabela `whatsapp_instances` ja suporta multiplas instancias. Basta o usuario cadastrar as 3 conexoes na aba "Conexoes" com a Evolution API de cada numero.

