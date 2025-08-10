Integrar o teu **NIC-RAG (vectorize.io)** no LibreChat de forma limpa. O caminho mais direto é expor o teu retrieval como **Tool** e forçar o agente a chamá-lo antes de responder. A Vectorize já oferece um **Retrieval Endpoint** HTTP (com auto-embedding, rewriting, re-ranking), então é só “empacotar” essa chamada como Tool. ([Vectorize Docs][1], [Vectorize][2])

Aqui vai um guia de implementação enxuto:

# Passo 1 — Testa teu endpoint da Vectorize

Confere o `retrieve` com um cURL mínimo (ajusta URL/IDs/chave):

```bash
curl -X POST "https://client.app.vectorize.io/api/gateways/service/{gateway_id}/{pipeline_id}/retrieve" \
  -H "Authorization: Bearer $VECTORIZE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"O que é o NIC?","topK":8,"filters":{}}'
```

A resposta deve trazer os **trechos** e metadados para contexto/citações. ([Vectorize Docs][1])

# Passo 2 — Cria um Tool “nicRag” no backend do LibreChat

O LibreChat recomenda estender `Tool` (LangChain) e registrar em `api/app/clients/tools/structured/`. Plugins antigos estão sendo deprecados — siga “Tools/Plugins” na doc. ([LibreChat][3])

Exemplo didático (TS) de Tool chamando a Vectorize:

```ts
// api/app/clients/tools/structured/nicRag.tool.ts
import { z } from "zod";
import { DynamicTool } from "@langchain/core/tools";
import fetch from "node-fetch";

export const nicRag = new DynamicTool({
  name: "nicRag",
  description:
    "Consulta o NIC-RAG (Vectorize) para recuperar contexto relevante e fontes.",
  schema: z.object({
    query: z.string(),
    top_k: z.number().int().min(1).max(50).default(8),
    filters: z.record(z.any()).optional(),
  }),
  func: async ({ query, top_k, filters }) => {
    const url = `${process.env.NIC_RAG_URL}/retrieve`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VECTORIZE_API_KEY ?? ""}`,
      },
      body: JSON.stringify({ query, topK: top_k, filters }),
    });
    if (!resp.ok) throw new Error(`NIC-RAG HTTP ${resp.status}`);
    const data = await resp.json();

    // Normaliza para o LLM (texto + fontes)
    const chunks = data?.chunks ?? data?.results ?? [];
    return JSON.stringify({
      context: chunks.map((c: any) => c.text ?? c.content ?? "").join("\n\n"),
      sources: chunks.map((c: any) => ({
        id: c.id ?? c.docId,
        url: c.url ?? c.source,
        score: c.score,
      })),
    });
  },
});
```

> A doc “Making your own Tools/Plugins” mostra a estrutura e onde registrar; use um Tool oficial (p.ex. Tavily/Browser) como referência do wiring. ([LibreChat][3])

# Passo 3 — Variáveis e Docker

No teu `docker-compose.override.yml` (ou `.env` do `api`):

```env
NIC_RAG_URL=https://client.app.vectorize.io/api/gateways/service/{gateway_id}/{pipeline_id}
VECTORIZE_API_KEY=xxxxx
```

(Reinicia os serviços do `api`.)

# Passo 4 — Habilita o Tool num Agente/Preset

Cria um **Agent** no LibreChat e ativa o `nicRag`. No system prompt do agente, força o uso:

> “Antes de responder, **sempre** chame o tool `nicRag` com a última pergunta do usuário. Incorpore `context` na resposta e liste `sources` quando fizer sentido.”

A doc de **Agents** e de **Tools** mostra como ligar um tool ao agente via UI/config. ([LibreChat][4])

# Passo 5 — (Opcional) Ajustar fluxo “3 etapas”

O runtime de tools no LibreChat segue o padrão:
**Request → Tool(nicRag) → Follow-up com contexto** (o modelo recebe o retorno do tool e continua). Se você precisa formato de citação específico, a recomendação é **formatar dentro do próprio tool** (ex.: `[[Title]](URL) ↑score`). ([LibreChat][3], [GitHub][5])

---

## Alternativas / Observações

* Se um dia quiser **emular o RAG API nativo do LibreChat** (centrado em “chat com arquivos”), dá para expor um endpoint compatível e apontar a app, mas isso é mais útil quando o gatilho é **upload de arquivos** — não “sempre consultar”. O fluxo via **Tool** é o que você descreveu. ([LibreChat][3])
* A Vectorize tem features úteis pra relevância (query rewriting, re-ranking, filtros) já no próprio endpoint — quanto mais você normalizar a saída no tool, melhor a experiência no chat. ([Vectorize][2])

---
[1]: https://docs.vectorize.io/rag-pipelines/retrieval-endpoint/?utm_source=chatgpt.com "Using the Retrieval Endpoint for a RAG Pipeline"
[2]: https://vectorize.io/blog/introducing-the-vectorize-api?utm_source=chatgpt.com "Introducing the Vectorize API"
[3]: https://www.librechat.ai/docs/development/tools_and_plugins?utm_source=chatgpt.com "Making your own Tools/Plugins"
[4]: https://www.librechat.ai/docs/features/agents?utm_source=chatgpt.com "Agents: Build Custom AI Assistants"
[5]: https://github.com/danny-avila/LibreChat/discussions/734?utm_source=chatgpt.com "Citation support for custom plugins · danny-avila LibreChat ..."
