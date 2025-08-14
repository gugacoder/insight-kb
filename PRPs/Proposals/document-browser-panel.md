---
up: []
related: ["workspace-selector"]
---

# Painel de Navegação de Documentos com Integração GitLab e Pasta Local

## Role
Act as a senior full-stack developer specialized in LibreChat and NIC Insight customization, with expertise in GitLab API integration, file system management, and React component development.

## Objective
Implementar um painel de navegação de documentos que permita navegar por arquivos de uma pasta local ou de um repositório GitLab, carregar documentos ao clicar e exibi-los no painel de artefatos existente do LibreChat.

## Context
- O sistema deve suportar duas fontes de documentos: GitLab e pasta local
- Para GitLab: configuração deve apontar para uma pasta específica de um repositório e carregar todos os documentos contidos
- Para pasta local: leitura de arquivos de uma pasta local no sistema
- Verificar se existe integração similar com Obsidian no LibreChat atual e avaliar se é o mesmo recurso
- O painel de artefatos já existe no LibreChat e deve ser estudado para entender seu funcionamento
- Os documentos devem ser carregados e exibidos no painel de artefatos quando clicados
- Configuração deve ser possível tanto via arquivo .env quanto pela interface do usuário
- Projeto atual é NIC Insight baseado em LibreChat, usando React/TypeScript no frontend e Node.js/Express no backend

## Instructions
1. **Análise da infraestrutura existente**:
   - Estudar o painel de artefatos atual no LibreChat para entender sua implementação
   - Verificar integração existente com Obsidian para avaliar se é funcionalidade similar
   - Analisar arquitetura de componentes React e padrões de desenvolvimento usados

2. **Implementação da configuração**:
   - Adicionar variáveis de ambiente para configuração GitLab (URL, token, pasta) e pasta local
   - Criar interface de configuração na UI para ambas as opções
   - Implementar validação de configurações

3. **Desenvolvimento da integração GitLab**:
   - Criar cliente GitLab API para autenticação e listagem de arquivos
   - Implementar navegação por estrutura de pastas do repositório
   - Adicionar cache para otimizar consultas à API

4. **Implementação da navegação local**:
   - Criar serviço backend para leitura de arquivos locais
   - Implementar navegação segura por estrutura de pastas
   - Adicionar verificações de segurança para prevenir acesso indevido

5. **Desenvolvimento do painel de navegação**:
   - Criar componente React para exibir árvore de documentos
   - Implementar interface de navegação por pastas
   - Adicionar funcionalidade de busca/filtro de documentos

6. **Integração com painel de artefatos**:
   - Estudar como o painel de artefatos carrega e exibe conteúdo
   - Implementar carregamento de documentos ao clicar nos itens
   - Garantir compatibilidade com diferentes tipos de arquivo (markdown, texto, etc.)

7. **Interface de usuário**:
   - Criar componente de seleção entre GitLab e pasta local
   - Implementar formulários de configuração para cada opção
   - Adicionar indicadores visuais de status de conexão

## Notes
- A configuração do GitLab (não "BitLab" como mencionado) deve incluir URL do servidor, token de acesso e caminho da pasta
- Importante manter compatibilidade com a arquitetura existente do LibreChat/NIC Insight
- Considerar performance ao navegar por muitos arquivos
- Implementar tratamento de erros adequado para falhas de conexão GitLab ou acesso a arquivos
- Documentar configurações necessárias para ambas as opções de fonte de documentos