# Implementação do Suporte ao GPT-5 no NIC Insight

## Resumo das Alterações Necessárias

Após análise do código puxado do LibreChat, identifiquei que o suporte ao GPT-5 foi implementado através de alterações simples em apenas 5 arquivos principais. A integração é direta e não requer mudanças arquiteturais.

## Arquivos a Modificar

### 1. **packages/data-provider/src/config.ts**
**Localização:** Linhas ~872-874 e ~1035-1037

**Alteração:** Adicionar os modelos GPT-5 às listas de modelos disponíveis:
```typescript
// Linha ~872 - sharedOpenAIModels
const sharedOpenAIModels = [
  'gpt-5',
  'gpt-5-mini',
  'gpt-5-nano',
  'gpt-4o-mini',
  'gpt-4o',
  // ... resto dos modelos
];

// Linha ~1035 - openAIModels (dentro da definição)
  'gpt-5',
  'gpt-5-mini',
  'gpt-5-nano',
```

### 2. **api/utils/tokens.js**
**Localização:** Linhas 22-24

**Alteração:** Adicionar limites de tokens para os modelos GPT-5:
```javascript
const openAIModels = {
  // ... outros modelos
  'gpt-5': 400000,
  'gpt-5-mini': 400000,
  'gpt-5-nano': 400000,
  // ... resto dos modelos
};
```

### 3. **api/models/tx.js**
**Localização:** Linhas 89-91, 93-95, 179-181, 219-224, 235-240

**Alteração 1:** Adicionar preços de tokens (linha ~89):
```javascript
tokenValues: {
  // ... outros modelos
  'gpt-5': { prompt: 1.25, completion: 10 },
  'gpt-5-mini': { prompt: 0.25, completion: 2 },
  'gpt-5-nano': { prompt: 0.05, completion: 0.4 },
}
```

**Alteração 2:** Adicionar preços de cache (linha ~179):
```javascript
cacheValues: {
  // ... outros modelos
  'gpt-5': { write: 1.25, read: 0.125 },
  'gpt-5-mini': { write: 0.25, read: 0.025 },
  'gpt-5-nano': { write: 0.05, read: 0.005 },
}
```

**Alteração 3:** Adicionar lógica de detecção do modelo (linha ~219):
```javascript
function getModelTokenKey(modelName) {
  // ... código existente
  } else if (modelName.includes('gpt-5-nano')) {
    return 'gpt-5-nano';
  } else if (modelName.includes('gpt-5-mini')) {
    return 'gpt-5-mini';
  } else if (modelName.includes('gpt-5')) {
    return 'gpt-5';
  // ... resto do código
}
```

### 4. **packages/api/src/endpoints/openai/llm.ts**
**Localização:** Linha ~302

**Alteração:** Atualizar regex para detectar GPT-5+ e aplicar configuração especial:
```typescript
// Linha 302 - mudar de /\bgpt-[5-9]\b/i para incluir GPT-5+
if (llmConfig.model && /\bgpt-[5-9]\b/i.test(llmConfig.model) && llmConfig.maxTokens != null) {
  const paramName = 
    llmConfig.useResponsesApi === true ? 'max_output_tokens' : 'max_completion_tokens';
  modelKwargs[paramName] = llmConfig.maxTokens;
  delete llmConfig.maxTokens;
  hasModelKwargs = true;
}
```

**Nota:** Esta regex já está correta no código atual (`/\bgpt-[5-9]\b/i`) e detecta GPT-5 até GPT-9.

### 5. **packages/data-provider/src/parsers.ts**
**Localização:** Linha ~190 (comentário)

**Alteração:** Apenas atualizar o comentário para refletir suporte ao GPT-5:
```typescript
/** Match GPT followed by digit, optional decimal, and optional suffix
 *
 * Examples: gpt-4, gpt-4o, gpt-4.5, gpt-5, gpt-5-mini, gpt-5-nano, etc. */
```

## Processo de Implementação

### Passo 1: Reverter as alterações locais
```bash
git stash  # ou git reset --hard HEAD se não quiser salvar as alterações
```

### Passo 2: Aplicar as alterações manualmente
Edite cada um dos 5 arquivos listados acima, adicionando apenas as linhas relacionadas ao GPT-5.

### Passo 3: Testar a integração
1. Reiniciar o servidor backend
2. Verificar se os modelos GPT-5 aparecem na interface
3. Testar uma conversa com um dos modelos GPT-5 (necessita API key válida)

## Notas Importantes

1. **Sem alterações estruturais**: A implementação do GPT-5 não requer mudanças arquiteturais ou de banco de dados.

2. **Configuração da API Key**: Será necessário ter uma API key válida da OpenAI com acesso aos modelos GPT-5.

3. **Três variantes do modelo**:
   - `gpt-5`: Modelo principal
   - `gpt-5-mini`: Versão menor e mais rápida
   - `gpt-5-nano`: Versão ultra-leve

4. **Limites de tokens**: Todos os três modelos foram configurados com limite de 400.000 tokens, significativamente maior que os modelos GPT-4.

5. **Preços**: Os valores de custo por token foram configurados, mas podem precisar de ajuste quando a OpenAI divulgar os preços oficiais.

## Resumo

A implementação é direta e envolve apenas adicionar as referências aos novos modelos GPT-5 nos arquivos de configuração existentes. Não há necessidade de criar novos arquivos ou alterar a arquitetura do sistema.