# git-commit.md

> Gera mensagens de commit concisas, padronizadas e sem ambiguidade, seguindo o modelo Conventional Commits.

## Objetivo

Declarar com precisão o que foi alterado e por quê, de forma legível por humanos e por máquinas.

## Tipos permitidos

- feat: nova funcionalidade
- fix: correção de bug
- docs: mudança em documentação
- refactor: reestruturação sem mudar comportamento
- style: ajustes visuais ou semânticos
- test: adição ou modificação de testes
- chore: manutenção ou melhorias internas
- build: mudanças em dependências, CI ou scripts

## Escopos recomendados

- system
- commands
- blueprint
- template
- domain
- feature
- task
- docs

## Exemplos

```
docs(system): transformar CLAUDE.md em README.md

- Remoção de referências à IA
- Padronização com estrutura DFT
```

```
feat(blog): adicionar comentários
feat(comments): adicionar suporte a comentários no blog
```

## Instruções obrigatórias

- Considere exclusivamente os arquivos que estão no estágio
- Ignore qualquer arquivo que não esteja no estágio
- Gere apenas a mensagem de commit no formato definido
- Execute imediatamente o commit com essa mensagem
- Não explique o que fez
- Não liste mudanças linha por linha
- Não use termos vagos como "ajustes" ou "melhorias"
- Declare somente o resultado final da alteração

## Notes

- Consider only the files that are already staged in GIT.
- Do not add new files to the GIT stage.
- If there are no files staged in GIT, do nothing and report the issue.
