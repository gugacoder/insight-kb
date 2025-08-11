# Guia de Estilo e Personalização Visual do LibreChat

Este guia descreve como personalizar a aparência do LibreChat, desde a alteração de logotipos e ícones até a modificação de temas de cores e fontes.

## Sumário

1.  [Alterando o Favicon](#1-alterando-o-favicon)
2.  [Alterando o Logotipo Principal](#2-alterando-o-logotipo-principal)
3.  [Alterando o Título da Aplicação](#3-alterando-o-título-da-aplicação)
4.  [Personalizando o Tema de Cores](#4-personalizando-o-tema-de-cores)
5.  [Personalizando as Fontes](#5-personalizando-as-fontes)
6.  [Ícones de Endpoints e Modelos](#6-ícones-de-endpoints-e-modelos)

---

### 1. Alterando o Favicon

O favicon aparece na aba do navegador. Para alterá-lo, você precisa substituir os seguintes arquivos no diretório `client/public/assets/`:

-   `favicon-16x16.png` (16x16 pixels)
-   `favicon-32x32.png` (32x32 pixels)
-   `apple-touch-icon-180x180.png` (180x180 pixels, para dispositivos Apple)
-   `icon-192x192.png` (192x192 pixels, para Progressive Web App)
-   `maskable-icon.png` (Ícone mascarável para PWA)

**Passos:**

1.  Crie seus próprios arquivos de favicon com os mesmos nomes e dimensões.
2.  Substitua os arquivos existentes em `client/public/assets/` pelos seus novos ícones.
3.  As referências aos favicons estão no arquivo `client/index.html` e não precisam ser alteradas se você mantiver os mesmos nomes de arquivo.

---

### 2. Alterando o Logotipo Principal

O logotipo principal é exibido na interface da aplicação.

-   **Localização do arquivo:** `client/public/assets/logo.svg`

**Passos:**

1.  Crie seu novo logotipo. Recomenda-se usar o formato SVG para escalabilidade e qualidade.
2.  Nomeie seu arquivo como `logo.svg`.
3.  Substitua o arquivo original em `client/public/assets/logo.svg` pelo seu.

Se você precisar usar um nome de arquivo diferente, precisará pesquisar no código-fonte do cliente (dentro de `client/src/`) por ocorrências de `logo.svg` e atualizar o caminho.

---

### 3. Alterando o Título da Aplicação

O título é exibido na barra de título do navegador e nos favoritos.

-   **Localização do arquivo:** `client/index.html`

**Passos:**

1.  Abra o arquivo `client/index.html`.
2.  Encontre a tag `<title>`:
    ```html
    <title>LibreChat</title>
    ```
3.  Altere o texto "LibreChat" para o título desejado.

---

### 4. Personalizando o Tema de Cores

As cores da interface são definidas usando Tailwind CSS. O arquivo de configuração principal permite a personalização de toda a paleta de cores.

-   **Localização do arquivo:** `client/tailwind.config.cjs`

**Como funciona:**

O arquivo `tailwind.config.cjs` define a paleta de cores na seção `theme.extend.colors`. O sistema usa variáveis CSS para temas claro e escuro, definidas em um arquivo CSS (provavelmente `client/src/style.css` ou similar).

**Passos para alterar as cores:**

1.  Abra o arquivo `client/tailwind.config.cjs`.
2.  Navegue até a seção `theme.extend.colors`.
3.  Você pode modificar as cores existentes (como `gray`, `green`, etc.) ou as cores semânticas (como `text-primary`, `surface-primary`, etc.).

    ```javascript
    // Exemplo de modificação de cores
    extend: {
      colors: {
        // Altere a paleta de cinza
        gray: {
          50: '#f8f8f8', // Cinza mais claro
          // ...
          900: '#1a1a1a', // Cinza mais escuro
        },
        // Altere as cores da marca
        'brand-purple': 'var(--brand-purple)', // O valor real está em um arquivo CSS
        // ...
      },
    }
    ```

4.  Para alterar as cores base dos temas (claro/escuro), procure por definições de variáveis CSS no projeto, provavelmente em `client/src/style.css`. Lá você encontrará as definições para `--text-primary`, `--surface-primary`, etc., que poderá ajustar.

---

### 5. Personalizando as Fontes

As fontes padrão da aplicação também são definidas no arquivo de configuração do Tailwind CSS.

-   **Localização do arquivo:** `client/tailwind.config.cjs`

**Passos:**

1.  Abra o arquivo `client/tailwind.config.cjs`.
2.  Localize a seção `theme.fontFamily`.

    ```javascript
    module.exports = {
      theme: {
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
          mono: ['Roboto Mono', 'monospace'],
        },
        // ...
      },
      // ...
    };
    ```

3.  Para usar uma nova fonte:
    a.  Primeiro, adicione os arquivos da fonte ao seu projeto (por exemplo, em `client/public/fonts/`).
    b.  Importe as fontes em seu CSS principal (por exemplo, `client/src/style.css`) usando `@font-face`.
    c.  Atualize a matriz `fontFamily` em `tailwind.config.cjs` com os nomes de suas novas fontes.

---

### 6. Ícones de Endpoints e Modelos

Os ícones para os diferentes modelos de IA e endpoints (como OpenAI, Google, etc.) estão localizados em `client/public/assets/`.

-   **Exemplos:** `openai.svg`, `google.svg`, `anthropic.png`.

Se você adicionar um novo modelo ou quiser alterar o ícone de um existente, pode substituir o arquivo correspondente neste diretório, mantendo o mesmo nome de arquivo.
