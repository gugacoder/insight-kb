# IMPLEMENTAÇÃO DO RAGE INTERCEPTOR NO LIBRECHAT

## SOBRE O RAGE
O RAGE (Retrieval Augmented Generation Engine) é um sistema de interceptação que enriquece automaticamente todas as conversas do LibreChat com conhecimento organizacional. Ele consulta a API Vectorize.io, que por sua vez acessa um banco vetorial Qdrant contendo a base de conhecimento da empresa. O objetivo é garantir que toda resposta dos LLMs seja contextualizada com informações relevantes da organização, de forma transparente para o usuário.

## INSTRUÇÕES DE IMPLEMENTAÇÃO

### ETAPA 1: CRIAR O RAGE INTERCEPTOR
Crie o arquivo `api/app/interceptors/RageInterceptor.js` com a seguinte estrutura:

```javascript
const fetch = require('node-fetch');
const { logger } = require('~/config');

class RageInterceptor {
  constructor() {
    // Habilita ou desabilita o RAGE completamente
    this.enabled = process.env.RAGE_ENABLED === 'true';
    
    // URL base da API Vectorize (ex: https://api.vectorize.io)
    this.vectorizeUri = process.env.RAGE_VECTORIZE_URI;
    
    // ID único da organização no Vectorize (ex: b11a1ab6-0885-4aa2-8ef3-724bed3cd960)
    this.orgId = process.env.RAGE_VECTORIZE_ORGANIZATION_ID;
    
    // ID único do pipeline no Vectorize que contém os documentos indexados
    this.pipelineId = process.env.RAGE_VECTORIZE_PIPELINE_ID;
    
    // Token JWT para autenticação na API Vectorize
    this.apiKey = process.env.RAGE_VECTORIZE_API_KEY;
    
    // Número de resultados a retornar (1-20). Quanto maior, mais contexto mas mais tokens
    this.numResults = parseInt(process.env.RAGE_NUM_RESULTS || '5');
    
    // Se deve aplicar reranking: melhora a qualidade dos resultados mas é mais lento
    // Reranking reorganiza os resultados por relevância usando algoritmos mais sofisticados
    this.rerank = process.env.RAGE_RERANK === 'true';
  }

  async enrichMessage(message, opts) {
    // Verificações de segurança - não falha se configuração estiver incompleta
    if (!this.enabled || !this.vectorizeUri || !this.orgId || !this.pipelineId) {
      logger.debug('[RAGE] Interceptor desabilitado ou configuração incompleta');
      return null;
    }

    try {
      // Constrói a URL do endpoint seguindo o padrão da API Vectorize
      const endpoint = `${this.vectorizeUri}/v1/org/${this.orgId}/pipelines/${this.pipelineId}/retrieval`;
      
      // Payload exato conforme especificação da API Vectorize
      const payload = {
        // A pergunta/mensagem do usuário para busca semântica
        question: message,
        // Quantos documentos relevantes retornar
        numResults: this.numResults,
        // Se deve aplicar reranking para melhorar relevância
        rerank: this.rerank,
        // Filtros de metadados (vazio = busca em todos os documentos)
        "metadata-filters": []
      };

      logger.debug('[RAGE] Consultando Vectorize:', { endpoint, question: message });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload),
        // Timeout de 5 segundos para não travar a conversa
        timeout: 5000
      });

      if (!response.ok) {
        logger.error(`[RAGE] Vectorize API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        logger.debug(`[RAGE] Encontrados ${data.results.length} resultados relevantes`);
        return this.formatContext(data.results);
      }
      
      logger.debug('[RAGE] Nenhum resultado relevante encontrado');
      return null;
    } catch (error) {
      logger.error('[RAGE] Erro ao consultar Vectorize:', error.message);
      return null;
    }
  }

  formatContext(results) {
    // Formata os resultados em um contexto legível para o LLM
    const contextParts = results.map((result, index) => {
      // Extrai fonte do documento (prioriza 'source', depois 'metadata.source')
      const source = result.source || result.metadata?.source || 'Base de Conhecimento';
      
      // Adiciona score de relevância se disponível (0.0 a 1.0, onde 1.0 é mais relevante)
      const score = result.score ? ` (relevância: ${result.score.toFixed(3)})` : '';
      
      return `[${index + 1}] Fonte: ${source}${score}\n${result.text}`;
    });
    
    // Retorna contexto formatado que será injetado como system message
    return `CONTEXTO DA BASE DE CONHECIMENTO:\n\n${contextParts.join('\n\n---\n\n')}`;
  }
}

module.exports = RageInterceptor;
```

### ETAPA 2: MODIFICAR O BASECLIENT
No arquivo `api/app/clients/BaseClient.js`, faça as seguintes modificações:

1. **Importar o RageInterceptor no topo do arquivo (próximo às outras importações):**
```javascript
const RageInterceptor = require('../interceptors/RageInterceptor');
```

2. **Adicionar no constructor da classe BaseClient:**
```javascript
constructor(apiKey, options = {}) {
  // ... código existente permanece inalterado ...
  
  // Inicializar RAGE Interceptor - adicione esta linha no final do constructor
  this.rageInterceptor = new RageInterceptor();
}
```

3. **Modificar o método sendMessage() na linha aproximada 567:**
Localize o método `async sendMessage(message, opts = {})` e adicione o código RAGE no início:

```javascript
async sendMessage(message, opts = {}) {
  // ===== RAGE INTERCEPTOR - ADICIONAR ESTAS LINHAS NO INÍCIO =====
  const rageContext = await this.rageInterceptor.enrichMessage(message, opts);
  if (rageContext) {
    opts.rageContext = rageContext;
    logger.debug('[RAGE] Contexto adicionado à requisição');
  }
  // ===== FIM DO CÓDIGO RAGE =====

  // ... todo o resto do código original permanece EXATAMENTE igual ...
  
  /** @type {Promise<TMessage>} */
  let userMessagePromise;
  const { user, head, isEdited, conversationId, responseMessageId, saveOptions, userMessage } =
    await this.handleStartMethods(message, opts);
  
  // ... resto do método continua inalterado ...
}
```

### ETAPA 3: IMPLEMENTAR INJEÇÃO DE CONTEXTO UNIVERSAL
No mesmo arquivo `BaseClient.js`, localize o método `addInstructions()` (aproximadamente linha 250) e modifique-o para suportar o contexto RAGE:

```javascript
addInstructions(messages, instructions, beforeLast = false) {
  // Código original permanece
  if (!instructions || Object.keys(instructions).length === 0) {
    return messages;
  }
  
  if (!beforeLast) {
    return [instructions, ...messages];
  }
  
  // Legacy behavior: add instructions before the last message
  const payload = [];
  if (messages.length > 1) {
    payload.push(...messages.slice(0, -1));
  }
  payload.push(instructions);
  if (messages.length > 0) {
    payload.push(messages[messages.length - 1]);
  }
  return payload;
}

// ===== ADICIONAR ESTE NOVO MÉTODO APÓS addInstructions =====
addRageContext(messages, rageContext) {
  if (!rageContext) {
    return messages;
  }
  
  // Cria mensagem do sistema com contexto RAGE
  const rageMessage = {
    role: 'system',
    content: rageContext
  };
  
  // Adiciona após instruções existentes (se houver) mas antes das mensagens de conversa
  const hasSystemMessage = messages.length > 0 && messages[0].role === 'system';
  if (hasSystemMessage) {
    // Insere após a primeira mensagem do sistema
    return [messages[0], rageMessage, ...messages.slice(1)];
  } else {
    // Adiciona no início se não há mensagem do sistema
    return [rageMessage, ...messages];
  }
}
```

### ETAPA 4: MODIFICAR O MÉTODO handleContextStrategy
No mesmo arquivo `BaseClient.js`, localize o método `handleContextStrategy()` e modifique para incluir o contexto RAGE:

```javascript
async handleContextStrategy({
  instructions,
  orderedMessages,
  formattedMessages,
  buildTokenMap = true,
}) {
  // ... código existente até a linha que constrói orderedWithInstructions ...
  
  let orderedWithInstructions = this.addInstructions(orderedMessages, instructions);
  
  // ===== ADICIONAR ESTA LINHA APÓS addInstructions =====
  if (this.currentOpts?.rageContext) {
    orderedWithInstructions = this.addRageContext(orderedWithInstructions, this.currentOpts.rageContext);
  }
  // ===== FIM DO CÓDIGO RAGE =====
  
  // ... resto do método permanece inalterado ...
}
```

### ETAPA 5: ARMAZENAR OPÇÕES NO BASECLIENT
No método `buildMessages()`, adicione uma linha para armazenar as opções:

```javascript
async buildMessages(messages, parentMessageId, opts, requestOpts) {
  // ===== ADICIONAR ESTA LINHA NO INÍCIO =====
  this.currentOpts = requestOpts;
  // ===== FIM =====
  
  // ... resto do método permanece inalterado ...
}
```

### ETAPA 6: CONFIGURAR VARIÁVEIS DE AMBIENTE
Adicione ao arquivo `.env` do seu projeto LibreChat:

```bash
# ===== RAGE CONFIGURATION =====
# Habilita o sistema RAGE (true/false)
RAGE_ENABLED=true

# URL base da API Vectorize (fornecida pela Vectorize.io)
RAGE_VECTORIZE_URI=https://api.vectorize.io

# ID da sua organização no Vectorize (GUID único)
RAGE_VECTORIZE_ORGANIZATION_ID=b11a1ab6-0885-4aa2-8ef3-724bed3cd960

# ID do pipeline que contém seus documentos indexados (GUID único)
RAGE_VECTORIZE_PIPELINE_ID=3c09774d-e27f-470c-b94b-63ea2b4b42f3

# Token JWT para autenticação (obtido do painel Vectorize.io)
RAGE_VECTORIZE_API_KEY=seu_jwt_token_aqui

# Número de documentos relevantes a retornar (1-20, recomendado: 3-7)
# Mais resultados = mais contexto mas consome mais tokens
RAGE_NUM_RESULTS=5

# Habilita reranking para melhor qualidade dos resultados (true/false)
# true = melhor qualidade mas mais lento, false = mais rápido
RAGE_RERANK=false
```

### DOCUMENTAÇÃO DAS VARIÁVEIS:

- **RAGE_ENABLED**: Liga/desliga todo o sistema RAGE
- **RAGE_VECTORIZE_URI**: URL da API Vectorize (geralmente https://api.vectorize.io)
- **RAGE_VECTORIZE_ORGANIZATION_ID**: Identificador único da sua organização na plataforma Vectorize
- **RAGE_VECTORIZE_PIPELINE_ID**: Identificador do pipeline específico que contém seus documentos indexados
- **RAGE_VECTORIZE_API_KEY**: Token de autenticação JWT obtido no painel da Vectorize.io
- **RAGE_NUM_RESULTS**: Quantos documentos relevantes buscar (1-20). Valores altos aumentam o contexto mas consomem mais tokens
- **RAGE_RERANK**: Se deve aplicar reranking nos resultados. O reranking usa algoritmos mais sofisticados para ordenar por relevância, melhorando a qualidade mas sendo mais lento

### RESULTADO ESPERADO:
Após a implementação, toda conversa no LibreChat será automaticamente enriquecida com contexto relevante do Qdrant via Vectorize.io. O usuário não perceberá diferença na interface, mas as respostas dos LLMs serão mais precisas e contextualizadas com informações da base de conhecimento organizacional.

### NOTAS ADICIONAIS:

- o projeto RAGE será posto em ./rageapi, para evitar macular a estrutura de código do proprio LibreChat.
- acrescnete também um README.md bem explicativo
- entao termos os componentes princiais:

```text
/
|
+-- api/
|
+-- client/
|
`-- rageapi/
    |
    `--- README.md
```

### LOGS DE MONITORAMENTO:
O sistema gerará logs com prefixo `[RAGE]` para facilitar o monitoramento:
- `[RAGE] Contexto adicionado à requisição` - quando contexto foi encontrado
- `[RAGE] Encontrados X resultados relevantes` - número de documentos encontrados
- `[RAGE] Nenhum resultado relevante encontrado` - quando a busca não retorna resultados
- `[RAGE] Vectorize API error: XXX` - erros da API Vectorize
- `[RAGE] Erro ao consultar Vectorize: XXX` - erros de conexão ou timeout