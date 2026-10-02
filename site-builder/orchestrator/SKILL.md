---
name: "orchestrator"
description: "Camada fina de orquestração do produto Construtor de Sites. A partir de um brief de 8 perguntas, sequencia o time de especialistas (PM, brand, design system, copy, SEO/GEO, frontend) num pipeline com dependências, delega a geração de variações visuais à skill agenthub (torneio) e entrega 2 artefatos de aprovação — um one-pager estratégico-visual e um preview de site — para validação do cliente ANTES do build completo. Não reimplementa execução: reusa skills existentes e a agenthub. Use quando o pedido envolver construir/gerar um site a partir de respostas de cliente, com identidade visual, copy, SEO e domínio."
license: MIT
metadata:
  version: 0.1.0
  author: Ric Neves - Flowgrammers
  category: site-builder
  domain: orchestration
  updated: 2026-06-21
  frameworks: pipeline-dag, approval-gate, tournament-delegation
agents:
  - claude-code
---

# Site Builder — Orchestrator

Camada fina entre o brief do cliente e o time de especialistas. **Não executa o
trabalho** — sequencia papéis, delega variações visuais à `agenthub` e entrega os
2 artefatos de aprovação. Toda execução real vem de skills que já existem no repo.

## Palavras-chave
construtor de sites, site builder, gerar site, criar site do cliente, brief de site,
identidade visual automática, preview de site, one-pager de marca, orquestrar time de site

---

## Princípios (regras do produto)

1. **Reuso, não reinvenção.** Cada etapa delega a uma skill existente. Esta skill só
   coordena, acompanha e sintetiza.
2. **Assertivo cedo.** Pergunte primeiro o que tem maior impacto (objetivo + personalidade)
   para já recomendar o resto.
3. **Nunca inventar contexto.** Só pré-preencha com dados fornecidos. Marque inferências
   como "confirme". Em dúvida, valide com o cliente — não chute.
4. **Gate antes do build.** Nada é construído por completo sem a aprovação dos 2 artefatos.
5. **Padrão "não parecer IA".** A qualidade vem de variação + curadoria (torneio via
   agenthub), não de um tema único reaproveitado.

---

## Entrada: Brief de 8 perguntas

O intake é de no máximo 8 perguntas, múltipla escolha sempre que possível, com
recomendações. Especificação completa em `references/brief-spec.md`. Resumo:

| # | Captura | Alimenta |
|---|---------|----------|
| 1 | Objetivo do site | arquétipo, CTA, estrutura |
| 2 | "O que faz" (1 frase) | copy + keywords |
| 3 | Cliente / segmento | tom, provas, linguagem |
| 4 | Personalidade (mood-board) | **design tokens** |
| 5 | Tom de voz (matriz) | voz da copy |
| 6 | Referências admiradas (opcional) | estética ancorada (anti-genérico) |
| 7 | Ativos disponíveis | o que é real vs. gerar |
| 8 | Domínio | checagem/sugestão |

Saída do intake: um `brief.json` (mesmo formato do spike em `spikes/site-builder/`).

---

## Pipeline (DAG de papéis)

O orchestrator roda os papéis nesta ordem de dependência. Cada papel é uma skill
existente — invoque-a, capture a saída, passe adiante.

```
brief.json
   │
   ▼
[1] PM ───────────► objetivo, escopo, métrica, estrutura de seções
   │
   ▼
[2] Brand ────────► posicionamento, identidade, matriz de tom
   │
   ├──────────────► [3] Design System ─► design tokens (cor/tipo/espaço)
   │                                          │
   ▼                                          ▼
[4] Copy ─────────► textos por seção    [VARIAÇÃO VISUAL → agenthub torneio]
   │                                          │
   ▼                                          │
[5] SEO/GEO ──────► keywords, schema, citabilidade
   │                                          │
   ▼                                          ▼
[6] Domínio ──────► checagem GoDaddy + Vercel (fonte dupla)
   │                                          │
   └──────────────► SÍNTESE ◄────────────────┘
                        │
                        ▼
        2 ARTEFATOS DE APROVAÇÃO (gate)
        ├─ one-pager.html  (manual visual estratégico)
        └─ preview         (Figma frame + URL Vercel)
                        │
                  cliente aprova?
                   │           │
                  não         sim
                   │           │
            itera brief   BUILD COMPLETO (frontend → Vercel + domínio)
```

### Mapa papel → skill existente (reuso)

| Etapa | Papel | Skill que executa |
|-------|-------|-------------------|
| 1 | Product Manager | `product-team/product-manager-toolkit/SKILL.md` |
| 2 | Brand / tom de voz | `marketing-skill/brand-guidelines/SKILL.md` |
| 3 | Design System / tokens | `product-team/ui-design-system/SKILL.md` |
| 4 | Copywriter | `marketing-skill/copywriting/SKILL.md` |
| 5 | SEO / GEO | `marketing-skill/ai-seo/SKILL.md` + `marketing-skill/seo-audit/SKILL.md` |
| 6 | Frontend / preview | `engineering-team/senior-frontend/SKILL.md` + `product-team/landing-page-generator/SKILL.md` |
| — | UX do formulário | `marketing-skill/form-cro/SKILL.md` |
| — | Backend (fase app) | `engineering-team/senior-backend/SKILL.md` |

---

## Delegação à agenthub (passos de variação visual)

Onde o produto precisa de "variações" e "não parecer IA", o orchestrator **não gera
um único resultado** — delega à `engineering/agenthub/SKILL.md` um torneio:

```
/hub:init   tarefa = "gerar direção visual do hero a partir de brief.json + tokens"
            agentes = 3..5 (cada um uma direção estética distinta)
            critério = juiz LLM: qualidade premium, originalidade, fidelidade ao brief
/hub:spawn  lança os agentes (worktrees isolados)
/hub:status acompanha progresso (board + state machine da agenthub)
/hub:eval   ranqueia por juiz LLM (modo qualidade)
/hub:merge  promove a melhor direção; arquiva as demais
```

A agenthub fica **intacta** — o orchestrator apenas a invoca nos passos certos:
- Direção visual do hero / paleta candidata
- Variações de copy do headline (A/B)
- Layouts alternativos de seção-chave

O acompanhamento desses passos usa o board (`dispatch/progress/results`) e a máquina
de estados que a agenthub já provê. O orchestrator lê `results/` e sintetiza.

---

## Os 2 artefatos de aprovação (gate)

**A. One-pager "Manual Visual Estratégico"** — 1 página, enxuto e impactante:
posicionamento, identidade (paleta + tipografia + mood), tom de voz (do/don't),
estrutura do site, SEO/GEO, domínios sugeridos. Produção: Canva brand template,
frame Figma, ou HTML (ver spike).

**B. Preview do site** — 1 página navegável (hero + 2–3 seções):
- Figma frame (superfície de aprovação visual)
- URL de preview na Vercel (site real)

**Regra de gate:** o BUILD COMPLETO só dispara após aprovação explícita dos dois.
Reprovou → ajusta o brief e re-roda só as etapas afetadas.

---

## Acompanhamento de progresso

| Estado | Significado |
|--------|-------------|
| `intake` | coletando as 8 respostas |
| `pipeline` | papéis executando em sequência |
| `tournament` | agenthub gerando/ranqueando variações visuais |
| `review` | 2 artefatos prontos, aguardando cliente |
| `approved` | cliente validou → liberado para build |
| `building` | frontend gerando site + deploy + domínio |

Para os passos de torneio, o estado real vem do `session_manager.py` da agenthub.
Para o pipeline, o orchestrator mantém um checklist simples por brief.

---

## Fundamentação (spike validado)

O encanamento ponta-a-ponta já foi provado em `spikes/site-builder/`:
- `brief.json` → `generate.ts` → `model.json` + `preview/index.html` + `one-pager.html`
  num único comando, sem cola manual.
- Checagem real de domínio via GoDaddy (detectou `nexumconsult.com` indisponível).
- Deploy Vercel e frame Figma prontos (aguardam aprovação de permissão MCP).

Este orchestrator formaliza esse fluxo como produto, trocando o mapeamento
determinístico do spike pelos papéis especialistas + torneio onde a qualidade importa.

---

## Padrões de qualidade (antes de entregar ao cliente)

- [ ] Nenhum campo do brief foi inventado — só dados fornecidos ou recomendações marcadas
- [ ] Os 2 artefatos derivam do MESMO modelo (tokens consistentes entre Figma e código)
- [ ] Passos visuais passaram por torneio (≥3 variações ranqueadas), não geração única
- [ ] Domínio checado em fonte real (GoDaddy + Vercel) — nunca assumir disponível
- [ ] SEO/GEO: title tag, meta, keywords e 1 frase de citabilidade presentes
- [ ] Build completo NÃO iniciado sem aprovação dos 2 artefatos
- [ ] Saída segue o tom definido na matriz (Q5), sem copy genérico

---

## Skills relacionadas

- **`engineering/agenthub`** — motor de torneio para variações visuais (delegado)
- **`c-level-advisor/chief-of-staff`** — padrão de roteamento `[INVOKE:role|question]` (referência)
- **`product-team/landing-page-generator`** — gera o site final (TSX/Next.js)
- **`marketing-skill/form-cro`** — desenha o formulário de 8 perguntas com baixa fricção

## Referências
- `references/brief-spec.md` — as 8 perguntas, opções, lógica de recomendação e guardrails
- `references/pipeline.md` — contrato de entrada/saída de cada etapa do DAG
- `spikes/site-builder/README.md` — prova de encanamento e resultados reais
