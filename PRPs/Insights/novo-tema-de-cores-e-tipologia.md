### Esquema de cores (Theme)

**Principais cores usadas no site e identidade da Claude AI**:
- **Primary (terra cota):** `#da7756` (RGB 218, 119, 86)
  - Usada para destaque, logotipo e elementos de chamada à ação, como botões importantes.
- **Secondary (preto sólido):** `#000000`
  - Usada para headers, textos principais, ícones e elementos que exigem contraste máximo.
- **Background:** `#eeece2` (RGB 238, 236, 226)
  - Usada como cor de fundo padrão, trazendo suavidade e contraste confortável.
- **Accent/Chat-Button:** `#bd5d3a` (RGB 189, 93, 58)
  - Usada para botões de chat ou ações secundárias, mantendo proximidade com o primary mas de tom um pouco mais escuro.
- **Text Default:** `#3d3929` (RGB 61, 57, 41)
  - Cor dos textos em geral, para garantir legibilidade contra o background claro.

#### Observações funcionais:
- **primary:** destaque visual e branding
- **accent:** interações de usuário (ex: chat, botões)
- **secondary/background:** composição de áreas, divisões e profundidade
- **foreground/text:** sempre contrastando para garantir acessibilidade

***

### Tipografia: Fontes utilizadas e classificação

**Logo:**
- **Font:** _copernicus_669e4a (customizada), fallback _copernicus_Fallback_669e4a_
  - **Função:** Exclusiva do logo/marca
  - **Origem:** Customizada para Anthropic

**Conteúdo/Textos principais:**
- **Font stack:** `ui-serif, Georgia, Cambria, "Times New Roman", Times, serif`
  - **Função:** **Primary** — corpo de texto, interface, parágrafos, explicações, menus, botões e títulos
  - **Origem:** Fontes seguras, sistema ou embutidas via Web (sem necessidade de Google Fonts, CDN externo, apenas rely nos stacks nativos do sistema)

**Resumo por função:**
- **Primary:** serif family stack (ui-serif/Georgia, etc.) — usabilidade e legibilidade, utilizado em todo o conteúdo textual principal para manter aspecto formal e claro.
- **Secondary/Tertiary/Accent:** Não foram identificadas outras famílias para títulos alternativos, pequenos destaques ou decorativos; tudo indica uso consistente da mesma pilha de serif para toda a interface.
- **Code blocks ou elementos técnicos:** se utilizados, tipicamente usam monospace padronizado do browser (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`), mas não foi explicitamente destacado como primário pela identidade.

***

### Origem das fontes

- **Logo:** Fonte exclusiva customizada, embutida/local da Anthropic.
- **Texto do site:** stack sistema-browser (sem CDN, Google Fonts, etc.; usar fontes já disponíveis no dispositivo do usuário, garantindo performance e fallback adequado).

***

### Variáveis CSS relevantes (por padrão de design web moderno):

Exemplos provavelmente presentes no CSS do Claude:
```css
:root {
  --color-primary: #da7756;
  --color-secondary: #000000;
  --color-bg: #eeece2;
  --color-accent: #bd5d3a;
  --color-text: #3d3929;
  --font-primary: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-logo: "copernicus_669e4a", serif;
}
```
- As variáveis podem ter outros nomes específicos, dependendo da implementação da plataforma.

***

### Exemplo de Theme Definition (high-level theme extract)

```json
{
  "colors": {
    "primary": "#da7756",
    "secondary": "#000000",
    "background": "#eeece2",
    "accent": "#bd5d3a",
    "foreground": "#3d3929"
  },
  "fonts": {
    "primary": {
      "stack": "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
      "role": "body, headings, UI text",
      "origin": "native/system"
    },
    "logo": {
      "family": "copernicus_669e4a",
      "fallback": "copernicus_Fallback_669e4a",
      "role": "brand/logo",
      "origin": "embedded, custom"
    }
  }
}
```

- **Observação:** Não detectado uso de CDN externo, webfonts de terceiros ou Google Fonts para texto de interface.[1]

***

Se você quiser os nomes exatos das variáveis CSS ou exemplos reais de selectors e uso, será necessário acesso ao CSS (developer tools) pois a interface pública oculta detalhes de implementação. Contudo, esse overview cobre o que é público e consolidado do design atual do Claude.ai.[1]

[1] https://beginswithai.com/claude-ai-logo-color-codes-fonts-downloadable-assets/
[2] https://claude.ai/chat/be995ca3-8e19-48bb-b5c8-9d48faf65d66
[3] https://claude.ai/chat/be995ca3-8e19-48bb-b5c8-9d48faf65d66
[4] https://www.reddit.com/r/ClaudeAI/comments/1hw2199/seriously_when_are_we_getting_a_better_ui_for/
[5] https://albato.com/blog/publications/how-to-use-claude-artifacts-guide
[6] https://darcynorman.net/notes/2025/2025-03-18-developing-a-custom-hugo-theme-with-claude/
[7] https://www.youtube.com/watch?v=McJluKfjVGk&vl=en
[8] https://kinsta.com/pt/blog/fontes-seguras-na-web/
[9] https://simonwillison.net/2025/Apr/3/
[10] https://collabnix.com/claude-code-best-practices-advanced-command-line-ai-development-in-2025/
[11] https://www.reddit.com/r/ClaudeAI/comments/1mhymkj/claudecode_performs_poorly_in_css_when_starting_a/?tl=pt-br
[12] https://www.anthropic.com/engineering/claude-code-best-practices
[13] https://www.youtube.com/watch?v=GntCkNgK0tg
[14] https://claude.ai
[15] https://www.reddit.com/r/ClaudeAI/comments/1m43nk2/struggling_to_generate_polished_ui_with_claude/
[16] https://blog.hubspot.com/website/ai-css-code-generators
[17] https://www.zendesk.com.br/service/messaging/chatbot/
[18] https://www.builder.io/blog/claude-code
[19] https://www.linkedin.com/posts/umangjaipuria_claude-artifact-claude-activity-7329503841576464386-pvQ4
[20] https://www.reddit.com/r/ClaudeAI/comments/1kxah1o/claude_code_front_end_design_and_css/?tl=pt-br
[21] https://www.youtube.com/watch?v=6j8WN6is54o
[22] https://periodicos.newsciencepubl.com/arace/article/download/4942/6900