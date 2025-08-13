## Goal

Transforme o brand LibreChat no brand NIC Insight.

## Overview

- NIC é a inteligência artificial da Processa Sistemas e significa Núcleo de Inteligência e Conhecimento.
- NIC Insight é o sistema de gestão da base de conhecimento da empresa potencializado pelo NIC.


## Context

### **System de Estilo do LibreChat**

Consulte `PRPs/Reports/LIBRECHAT_RAG_GUIDE.md` para entender:
- Como o sistema de estilos funciona no LibreChat
- Arquivos de configura��o de tema
- Componentes customiz�veis
- Processo de build e deploy de estilo

### **Esquema de Cores**

O esquema de cores é oferido em:
- `PRPs/Examples/nic-dark-theme.json`
- `PRPs/Examples/nic-light-theme.json`

NOTA: Estes exemplos de tema seguem a estrutura de arquivo JSON de tema do VSCodium.

### **Logomarca**

A logomarca é oferida em 4 temas:
- `PRPs/Examples/nic-logo-dark-pad.svg` - Dark com padding que produz uma margem de segurança pra imagem
- `PRPs/Examples/nic-logo-dark.svg` - Dark sem padding, portanto, sem margem de segurança
- `PRPs/Examples/nic-logo-pad.svg` - Light com padding que produz uma margem de segurança pra imagem
- `PRPs/Examples/nic-logo.svg` - Light sem padding, portanto, sem margem de segurança

### **Favicon**

O favicon é oferido em 2 temas:
- `PRPs/Examples/favicon-dark.ico`
- `PRPs/Examples/favicon.ico`

## Instructions

1. FASE 1: Substitua a logomarca do LibreChat pela logomarca do NIC Insight
    - Enumere todas as imagens de logomarca
    - Colete o tipo, o tamanho e os parâmetros de qualidade de cada imagem.
    - Determine o tema, Dark ou Light, da imagem
    - Selecione o SVG base apropriado entre:
        - `nic-logo-dark-pad.svg`
        - `nic-logo-dark.svg`
        - `nic-logo-pad.svg`
        - `nic-logo.svg`
    - Aplique um algoritmo que converta o SVG no tipo, tamanho e parâmetro de qualidade correspondente à imagem original.

2. FASE 2: Ao lado do nome do LibreChat na interface, costuma aparecer um ícone/emoji de folha. Substitua o ícone/emoji de folha por um ícone/emoji de robô.

3. FASE 3: Aplique o favicon de forma consistente. 

4. FASE 4: Aplique o "Esquema de Cores" em toda a interface do sistema de forma consistente, para tema claro e tema escuro.
    - Estude os materiais de referência:
       - `nic-dark-theme.json`
       - `nic-light-theme.json`
    - Enumere os componentes e seu correspondente formato de estilo. 
    - Aplique consistentemente o estilo nesses componentes. 

## Notas

- **DO NOT OVERTHINK**
- **DO NOT OVERENGINEER**
- **DO NOT CHANGE LIBRECHAT FEATURES EXCEPT THOSE LISTED IN THIS PROMPT**