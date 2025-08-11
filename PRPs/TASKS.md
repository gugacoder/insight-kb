# TASKS

---

* [ ] **Criar Custom Tool no LibreChat**

  * [ ] Abrir painel de administração do LibreChat
  * [ ] Ir em **Configurações → Ferramentas / Tools**
  * [ ] Clicar em **Adicionar nova Tool**
  * [ ] Definir **nome** da Tool (ex.: `qdrant_search`)
  * [ ] Definir **descrição** (ex.: “Busca contextos relevantes no Qdrant”)
  * [ ] Inserir **URL** do seu endpoint de retrieval
  * [ ] Selecionar **método HTTP** correto (POST/GET)
  * [ ] Configurar **schema de parâmetros** esperado pelo endpoint
  * [ ] Salvar e testar a Tool

---

* [ ] **Criar Preset com a Tool ativada**

  * [ ] Abrir painel de administração do LibreChat
  * [ ] Ir em **Configurações → Presets / Agentes**
  * [ ] Clicar em **Adicionar novo Preset**
  * [ ] Escolher **modelo** (ex.: GPT-5)
  * [ ] Adicionar **System Prompt** instruindo a sempre usar o Qdrant
  * [ ] Selecionar a **Tool** `qdrant_search` e marcar como ativa
  * [ ] Salvar o Preset

---

* [ ] **Testar conversa a partir do Preset**

  * [ ] Iniciar novo chat no LibreChat escolhendo o Preset criado
  * [ ] Fazer pergunta simples e confirmar que a Tool foi chamada
  * [ ] Validar se a resposta usa os dados do Qdrant
  * [ ] Ajustar prompt ou Tool se necessário
