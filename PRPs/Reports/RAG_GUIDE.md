# Ponto de Interceptação para RAG Middleware

## Ponto Exato para Interceptação das Transações com o LLM

### **📍 Local Principal de Interceptação:**

**`/home/coder/insight-kb/api/app/clients/BaseClient.js:567`** - Método `async sendMessage()`

Este é o ponto central onde a MAIORIA das requisições ao LLM passam antes de serem processadas. As seguintes implementações herdam desta classe base:
- ✅ **OpenAI** (OpenAIClient)
- ✅ **Anthropic** (AnthropicClient)
- ✅ **Google** (GoogleClient)
- ✅ **Custom Endpoints** (via BaseClient)
- ✅ **Agents** (AgentClient)
- ⚠️ **Assistants** - USA FLUXO DIFERENTE (OpenAI Assistants API)

### **🔄 Fluxo da Requisição:**

1. **Entrada:** POST request → `/api/agents/chat` (ou outros endpoints)
2. **Middleware:** `buildEndpointOption.js:31` - Constrói opções do endpoint
3. **Controller:** `agents/request.js:184` - Chama `client.sendMessage()`
4. **BaseClient:** `BaseClient.js:567` - **PONTO DE INTERCEPTAÇÃO IDEAL**

### **💡 Como Implementar a Interceptação:**

No método `sendMessage` em `BaseClient.js:567-571`, você pode injetar seu código assim:

```javascript
async sendMessage(message, opts = {}) {
  // ⚡ AQUI - Antes de processar a mensagem
  // Interceptar e enriquecer com dados do quadrante
  
  // 1. Fazer consulta ao quadrante
  // 2. Obter embeddings relevantes  
  // 3. Injetar contexto adicional na mensagem
  
  const enrichedMessage = await this.enrichMessageWithQuadrant(message);
  
  // Continua o fluxo normal...
  const { user, head, isEdited, conversationId, responseMessageId, saveOptions, userMessage } =
    await this.handleStartMethods(enrichedMessage, opts);
```

### **🎯 Por que este é o melhor ponto:**

1. **Centralizado:** Todos os providers (OpenAI, Anthropic, etc.) passam por aqui
2. **Pré-processamento:** Ocorre ANTES da mensagem ser enviada ao LLM
3. **Acesso completo:** Tem acesso a todo contexto da conversa e configurações
4. **Não invasivo:** Modificação mínima no código existente

### **📊 Estruturas de Dados Disponíveis:**

No ponto de interceptação você terá acesso a:
- `message`: Texto da mensagem do usuário
- `opts`: Opções incluindo `conversationId`, `parentMessageId`, contexto
- `this.currentMessages`: Histórico completo da conversa
- `this.options`: Configurações do cliente/modelo

### **🔗 Arquivos Relacionados:**

- **BaseClient:** `/api/app/clients/BaseClient.js` - Classe base com o método sendMessage
- **AgentController:** `/api/server/controllers/agents/request.js` - Controller que chama sendMessage
- **BuildEndpoint:** `/api/server/middleware/buildEndpointOption.js` - Middleware de preparação
- **Routes:** `/api/server/routes/agents/chat.js` - Definição das rotas

### **⚠️ Caso Especial: Assistants API**

Os Assistants (OpenAI Assistants API) NÃO passam pelo `BaseClient.sendMessage()`. Eles têm seu próprio fluxo:

1. **Entrada:** POST → `/api/assistants/chat`
2. **Controller:** `/api/server/controllers/assistants/chatV1.js:49`
3. **Serviço:** `/api/server/services/AssistantService.js` - `runAssistant()`
4. **OpenAI API:** Chamada direta para API do OpenAI Assistants

**Para interceptar Assistants**, você precisaria modificar:
- `/api/server/controllers/assistants/chatV1.js` - Antes de chamar `runAssistant()`
- OU `/api/server/services/createRunBody.js` - Onde o corpo da requisição é montado

### **📝 Notas de Implementação:**

Este é o local ideal para implementar sua lógica de enriquecimento com embeddings do quadrante antes que a requisição seja enviada ao LLM. A interceptação aqui garante que:

1. A maioria das requisições sejam enriquecidas (exceto Assistants)
2. O contexto adicional seja incluído antes do processamento
3. A resposta do LLM já considere as informações do quadrante
4. Não seja necessário modificar múltiplos endpoints (exceto para Assistants)

### **🎯 Recomendação Final:**

Para uma solução completa que cubra TODOS os casos:

1. **Implemente no `BaseClient.sendMessage()`** para cobrir 90% dos casos (Agents, OpenAI, Anthropic, Google, Custom)
2. **Adicione interceptação em `/api/server/controllers/assistants/chatV1.js`** para cobrir o caso dos Assistants
3. Considere criar um serviço centralizado de enriquecimento RAG que possa ser chamado de ambos os pontos