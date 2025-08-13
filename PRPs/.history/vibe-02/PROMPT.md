# PROMPT: Migração do Sistema de Logging RAGE para Logger LibreChat

## Role
Você é um arquiteto de software especialista em sistemas de logging e integração de componentes Node.js. Sua tarefa é migrar o sistema de logging customizado do RAGE para utilizar o logger Winston já configurado do LibreChat.

## Objectives
1. **Eliminar dependência circular** entre ConfigManager e RageLogger
2. **Simplificar arquitetura** removendo logger customizado desnecessário
3. **Integrar logs RAGE** com infraestrutura existente do LibreChat
4. **Manter funcionalidades essenciais** como correlation IDs e structured logging
5. **Garantir compatibilidade** com ambiente de produção

## Context

### Problema Atual
O sistema RAGE possui um logger customizado (`rageapi/logging/logger.js`) que cria dependência circular:
- ConfigManager precisa do RageLogger 
- RageLogger precisa do ConfigManager
- Isso causa timing issues e falhas de inicialização

### Logger LibreChat Existente
- **Localização:** `~/config/winston`
- **Tecnologia:** Winston com configuração completa
- **Recursos:** Daily rotation, múltiplos transports, formatação estruturada
- **Status:** Já inicializado e funcional quando aplicação sobe
- **Uso:** Outros componentes já utilizam (`require('~/config/winston')`)

### Arquivos Afetados
- `rageapi/config/index.js` - Remove dependência do RageLogger
- `rageapi/interceptors/RageInterceptor.js` - Atualizar imports
- `rageapi/resilience/errorHandler.js` - Atualizar imports  
- `rageapi/enrichment/` - Todos os arquivos que usam logging
- `rageapi/utils/vectorizeClient.js` - Atualizar imports
- **Remover:** `rageapi/logging/logger.js` completamente

## Instructions

### 1. Análise Preliminar
- Identifique TODOS os arquivos que importam ou usam RageLogger
- Mapeie quais funcionalidades específicas do RageLogger são essenciais
- Verifique compatibilidade do Winston LibreChat com metadata estruturada

### 2. Estratégia de Migração
- **Replace pattern:** `const { rageLogger } = require('../logging/logger')` → `const logger = require('~/config/winston')`
- **Correlation IDs:** Implementar via metadata do Winston: `logger.info('message', { correlationId, ...metadata })`
- **Service identification:** Adicionar tag `service: 'rage'` em todos os logs
- **Structured logging:** Manter formato `{ timestamp, level, service, message, correlationId, ...context }`

### 3. Ordem de Implementação
1. **Primeiro:** Atualizar `rageapi/config/index.js` para usar Winston
2. **Segundo:** Atualizar todos os componentes de resilience/ e enrichment/
3. **Terceiro:** Atualizar RageInterceptor.js
4. **Último:** Remover `rageapi/logging/logger.js` e dependencies

### 4. Formato de Log Padrão
```javascript
// Padrão para logs RAGE
logger.info('RAGE operation completed', {
  service: 'rage',
  correlationId: 'correlation-id-here',
  operation: 'enrichMessage',
  duration: 150,
  userId: 'user-id',
  // ... other context
});
```

### 5. Validação
- Testar que não há mais dependências circulares
- Verificar que logs RAGE aparecem integrados com logs LibreChat
- Confirmar que correlation IDs e structured data funcionam
- Testar ferramenta `rage-query.js` continua funcionando

## Notes

### Cuidados Importantes
- **NÃO alterar** nenhum arquivo do LibreChat (`api/config/winston.js`)
- **MANTER** todas as funcionalidades de logging existentes
- **PRESERVAR** correlation IDs e structured logging
- **GARANTIR** que falhas de logging não quebrem funcionalidade RAGE

### Path Resolution
- Usar `require('~/config/winston')` dentro do rageapi/ pode não funcionar
- Alternativa: `require('../../api/config/winston')` ou path absoluto
- Testar resolução de path antes de implementar em todos arquivos

### Rollback Strategy
- Manter backup do `rageapi/logging/logger.js` até validação completa
- Documentar exatamente quais arquivos foram alterados
- Ter procedimento de rollback caso integração falhe

### Benefícios Esperados
- **Zero dependência circular**
- **Timing issues eliminados** 
- **Logs integrados** com resto do sistema
- **Infraestrutura consolidada**
- **Menor complexity** de manutenção
