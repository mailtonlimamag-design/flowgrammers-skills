# Spike: Site Builder — Ponta-a-ponta (encanamento)

**Data:** 2026-06-21
**Objetivo:** Provar que o fluxo `brief.json → model.json → página → one-pager → domínio` roda
completamente a partir de um único JSON, sem cola manual entre etapas.
**Escopo:** Encanamento. Sem capricho visual. Design premium = 2º spike.

---

## Como rodar

```bash
cd spikes/site-builder
npx ts-node --esm generate.ts
# saída: model.json, preview/index.html, one-pager.html
```

Requer: Node.js ≥ 18, `ts-node` via npx (sem install prévio).

---

## Artefatos gerados

| Arquivo | O que é |
|---------|---------|
| `brief.json` | Brief fictício com 8 respostas (entrada do spike) |
| `model.json` | Modelo de conteúdo derivado deterministicamente do brief |
| `preview/index.html` | Preview do site com tokens visuais reais |
| `one-pager.html` | Manual Visual Estratégico (identidade + SEO + tom + domínios) |
| `preview/vercel.json` | Config para deploy estático na Vercel |

---

## Resultados — Checagem de Domínio (fonte dupla)

### GoDaddy (via MCP — resultado real, 2026-06-21)

| Domínio | Status |
|---------|--------|
| `nexumfinanceiro.com.br` | ✅ DISPONÍVEL |
| `nexumfinanceiro.com` | ✅ DISPONÍVEL |
| `nexumconsult.com.br` | ✅ DISPONÍVEL |
| `nexumconsult.com` | ❌ INDISPONÍVEL — registrado |

**Observation:** Checagem cruzada funcionou. `nexumconsult.com` é o único bloqueado —
o sistema já devolveria 3 opções viáveis + sugestões alternativas automáticas.

### Vercel (via MCP)

`check_domain_availability_and_price` exige aprovação de permissão no ambiente remoto.
Para habilitar: Settings → Permissions → liberar o servidor Vercel MCP.

**Impacto:** Redundância de fonte não foi provada neste run, mas a arquitetura está pronta
(basta aprovar a permissão). O resultado da GoDaddy já cobre o caso de uso.

---

## Resultado — Deploy Vercel

`deploy_to_vercel` exige aprovação de permissão (mesmo motivo acima).
O `preview/vercel.json` está configurado como site estático pronto para deploy.

Para rodar manualmente:
```bash
cd spikes/site-builder/preview
npx vercel --prod --token $VERCEL_TOKEN
```

---

## Resultado — Frame Figma

`create_new_file` (Figma MCP) requer aprovação de permissão neste ambiente remoto.
Conta conectada confirmada: **Mailton Design** (Pro, `team::1539414299286139928`).

Para executar esta etapa:
1. Nas configurações do ambiente remoto, liberar as ferramentas do servidor Figma MCP.
2. Rodar: o código abaixo cria um arquivo + frame de design tokens em 1 chamada.

```js
// use_figma — criar frame de tokens a partir de model.json
const tokens = {
  cores: { primaria: "#1B2B4B", secundaria: "#2D3748", acento: "#38A169", fundo: "#F9FAFB" },
  tipografia: { titulo: "Inter", corpo: "Inter" },
  mood: ["confiança", "proximidade"]
};
// frame 1200×800, swatches de cor, amostra tipográfica, export de tokens como variáveis
```

**O que será provado:** os mesmos tokens de `model.json` alimentam o Figma —
consistência garantida entre a superfície de aprovação e o site gerado.

---

## Validação dos critérios de sucesso

| Critério | Status | Observação |
|----------|--------|------------|
| Fluxo roda a partir de 1 único JSON | ✅ | `generate.ts` lê `brief.json`, escreve todos os artefatos |
| Zero cola manual entre etapas | ✅ | Um único `npx ts-node --esm generate.ts` |
| Checagem de domínio retorna dados reais | ✅ | GoDaddy: 4 domínios checados, 1 indisponível detectado |
| Preview URL carrega | ⏳ | Aguarda permissão Vercel MCP ou token |
| Frame Figma criado dos tokens | ⏳ | Conta confirmada; bloqueado por permissão MCP |
| Redundância GoDaddy + Vercel | ⏳ | Bloqueado por permissão MCP |

---

## Observações técnicas relevantes para a decisão de produto

1. **A geração de tokens é 100% determinística** — dado o mesmo brief, o output é idêntico.
   Isso é bom para consistência, mas significa que o "não-parecer-IA" precisa vir dos
   **mundos de estilo curados** (Q4) e **referências reais** (Q6), não de aleatoriedade.

2. **O caso `nexumconsult.com` indisponível** prova que a checagem real importa —
   o sistema não pode assumir disponibilidade, precisa checar e oferecer alternativas.

3. **Dois pipelines (Figma + código) compartilham o mesmo `model.json`** — tokens de cor
   e tipografia saem do mesmo objeto, garantindo consistência entre aprovação visual
   e site final.

4. **Risco principal não coberto:** qualidade visual premium ("inveja do Behance").
   Próximo spike recomendado: 1 brief → `ui-design-system` skill + Figma generate_design
   + avaliar se passa no teste visual.

5. **Bug corrigido no gerador:** slug `nexumfinanceirofinanceiro.com.br` (concatenação
   ingênua do nome completo + sufixo) foi corrigido para usar `slug_short` (primeiro
   termo da marca) + sufixo semântico.
