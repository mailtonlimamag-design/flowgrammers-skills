# HANDOFF — Construtor de Sites & Landing Pages (produto inteligente)

> Documento de continuidade. Uma nova sessão na nuvem clona este repo do zero —
> leia isto primeiro para retomar sem perder contexto. Última atualização: 2026-10-01.

## O que é o produto

Um sistema que, a partir de um **formulário de no máximo 8 perguntas** respondido
pelo cliente, gera automaticamente: objetivo do site, variações, textos, identidade
visual, tom de voz, SEO/GEO e sugestão/checagem de domínio. Antes de construir o site
completo, entrega **2 artefatos para o cliente aprovar**:
1. **One-pager estratégico-visual** (manual de marca enxuto e impactante).
2. **Preview do site** (frame no Figma + URL de preview na Vercel).

Meta de qualidade: resultados que **não parecem feitos por IA** — nível Behance/Dribbble.

## Estado atual (fonte da verdade)

- **Branch:** `claude/site-builder-brainstorm-xtwba1`
- **PR:** #5 (draft, aberto) — https://github.com/mailtonlimamag-design/flowgrammers-skills/pull/5
- **CI:** verde (validate_skills + check_doc_refs + smoke install)

### O que já existe

| Artefato | Caminho | Estado |
|----------|---------|--------|
| Spike ponta-a-ponta | `spikes/site-builder/` | ✅ funciona |
| — gerador | `spikes/site-builder/generate.ts` | brief → model → preview + one-pager |
| — resultados | `spikes/site-builder/README.md` | checagem de domínio real documentada |
| Orquestrador (camada fina) | `site-builder/orchestrator/SKILL.md` | ✅ definido |
| — brief de 8 perguntas | `site-builder/orchestrator/references/brief-spec.md` | ✅ |
| — contrato do pipeline | `site-builder/orchestrator/references/pipeline.md` | ✅ |

### Arquitetura (decisão central)

Em vez de criar um "director" novo, **reusamos coordenação existente**:
- **`engineering/agenthub`** (intacta) = motor de **torneio** para variações visuais
  (N agentes competindo, escolhe o melhor). Serve "gerar variações" + "não parecer IA".
- **`site-builder/orchestrator`** = camada **fina** que sequencia o time num DAG
  (PM → brand → design system → copy → SEO/GEO → frontend), cada etapa delegando a
  uma skill existente, e chama a `agenthub` só nos passos visuais.

Mapa papel → skill existente: ver tabela em `site-builder/orchestrator/SKILL.md`.

## Decisões travadas (não reabrir sem o fundador pedir)

1. **Entrega dupla:** design no Figma (superfície de aprovação) + código Next.js/Vercel.
2. **App-web do cliente = backlog.** Depende de validação de caso de negócio pelo PM.
   Fase 0 = agência opera o orquestrador; Fase 1 = app self-service só após provar
   qualidade e disposição a pagar.
3. **Brief de no máximo 8 perguntas**, múltipla escolha, com recomendações.
4. **Gate:** 2 artefatos aprovados antes de qualquer build completo.
5. **Nunca inventar contexto.** Pré-preencher só com dados fornecidos; marcar
   inferências como "confirme"; em dúvida, validar com o cliente.

## Provado vs. pendente

| Item | Estado |
|------|--------|
| Encanamento brief → modelo → preview + one-pager | ✅ provado (spike) |
| Checagem real de domínio (GoDaddy) | ✅ provado (`nexumconsult.com` indisponível) |
| Deploy Vercel | ⏳ pendente — exige aprovação de permissão MCP |
| Checagem de domínio via Vercel (fonte dupla) | ⏳ pendente — permissão MCP |
| Frame Figma a partir dos tokens | ⏳ pendente — permissão MCP |
| **Qualidade visual premium ("não parecer IA")** | ❌ **não coberto — risco #1** |

## Próximos passos

### PRIORIDADE: Teste completo end-to-end com o time de especialistas (workflow inteligente)

A próxima sessão deve rodar um **teste completo** (não só um spike isolado) que
exercite o produto de ponta a ponta com o time abaixo operando num **workflow
inteligente** (multi-agente), com **modelo certo por tipo de tarefa** e uma
**rodada obrigatória de validação crítica** (revisão de conteúdo E código) para a
documentação sair correta e coerente.

**Time de especialistas → skills reais do repo:**

| Especialista | Skills |
|--------------|--------|
| Design (UI + marca) | `product-team/ui-design-system`, `marketing-skill/brand-guidelines` |
| Produto | `product-team/product-manager-toolkit`, `product-team/product-strategist`, `product-team/growth-product-manager` |
| Engenharia | `engineering-team/senior-frontend`, `engineering-team/senior-backend` |
| Prompt engineering | `engineering-team/senior-prompt-engineer`, `marketing-skill/prompt-engineer-toolkit`, `engineering/prompt-governance` |
| AI / LLM | `engineering-team/senior-ml-engineer`, `engineering/llm-cost-optimizer`, `engineering/llm-wiki`, `engineering-team/ai-security` |
| Advisor executivo (GTM / novos mercados e negócios) | `c-level-advisor/ceo-advisor`, `c-level-advisor/cmo-advisor`, `c-level-advisor/intl-expansion`, `c-level-advisor/scenario-war-room`, `marketing-skill/launch-strategy`, `marketing-skill/marketing-strategy-pmm`, `finance/business-investment-advisor` |

**Orquestração do workflow inteligente:**
- Usar o **Workflow tool** (orquestração multi-agente) e/ou a `engineering/agenthub`
  para os passos de variação/torneio. O Workflow tool exige opt-in explícito do
  fundador — ele já pediu este teste, então vale confirmar o comando ("use um
  workflow" / "ultracode") ao iniciar.
- O `site-builder/orchestrator` continua sendo a camada fina que sequencia os papéis
  e delega aos especialistas e à agenthub.

**Modelo certo por quebra de tarefa (regra):**
- Raciocínio difícil / arquitetura / estratégia GTM / revisão crítica → modelo mais forte (Opus).
- Execução (código, copy, tokens de design, geração de páginas) → modelo intermediário (Sonnet).
- Tarefas simples / mecânicas / alto volume → modelo leve (Haiku).

**Rodada de validação crítica (obrigatória antes de concluir):**
- Revisão de **conteúdo** (copy, posicionamento, SEO/GEO — coerência e sem invenção).
- Revisão de **código** (rodar `scripts/validate_skills.py` + `scripts/check_doc_refs.py`;
  lint; sanidade do gerador).
- Revisão de **documentação** (handoff e artefatos atualizados, coerentes entre si).

### Outros próximos passos

1. **2º spike — qualidade visual premium.** Torneio da `agenthub` (3–5 variações,
   juiz por qualidade) a partir de 1 brief; one-pager + 1 hero premium; julgar "teste Behance".
2. Liberar permissões MCP (Vercel, Figma) e completar deploy + frame + checagem dupla.
3. Avaliação do PM sobre seguir com o app-web (caso de negócio, custo, complexidade).

## Guardrails de trabalho

- Reusar skills existentes; não reinventar.
- Manter CI verde: rodar `scripts/validate_skills.py` e `scripts/check_doc_refs.py`
  localmente antes de commitar.
- Arquivos novos do produto vivem em `site-builder/` e `spikes/site-builder/`
  (folders top-level fora dos 9 domínios → não alteram a contagem de skills do README).
- Commitar no branch `claude/site-builder-brainstorm-xtwba1`; PR como draft.

## Aprendizados de outras sessões/projetos

O fundador trará aprendizados e referências de outras sessões e projetos.
**Não presumir nem inventar** — se forem relevantes e ainda não enviados, pedir antes
de usar.

---

## Prompt para abrir a nova sessão na nuvem

> **Contexto:** Estamos evoluindo um produto inteligente de criação de **sites e
> landing pages** no repo `flowgrammers-skills`. O trabalho até aqui está no branch
> `claude/site-builder-brainstorm-xtwba1` (PR #5).
>
> **Primeira ação obrigatória:** leia, nesta ordem: (1) `site-builder/HANDOFF.md`,
> (2) `site-builder/orchestrator/SKILL.md` e `site-builder/orchestrator/references/`,
> (3) `spikes/site-builder/README.md`.
>
> **Decisões travadas (não reabrir sem eu pedir):** entrega dupla (Figma + Next.js/Vercel);
> app-web = backlog (PM valida negócio); brief de 8 perguntas; 2 artefatos de aprovação
> antes do build; nunca inventar contexto.
>
> **Meta desta sessão — TESTE COMPLETO end-to-end com o time, em workflow inteligente:**
> rode o produto de ponta a ponta exercitando meus especialistas — **design, produto,
> engenharia, prompt engineering, AI e advisor executivo de GTM/novos mercados e
> negócios** (mapa especialista→skills no HANDOFF). Orquestre num **workflow inteligente**
> (Workflow tool multi-agente e/ou `agenthub` para torneios), com **modelo certo por
> tarefa** (Opus p/ raciocínio difícil/arquitetura/estratégia/revisão crítica; Sonnet
> p/ execução; Haiku p/ tarefas simples) e **sempre uma rodada de validação crítica**
> (revisão de conteúdo E código) para a documentação sair correta e coerente. Inclua o
> 2º spike de qualidade visual premium dentro desse teste. Mantenha a `agenthub` intacta.
> (O Workflow tool exige opt-in — eu já pedi; confirme comigo "use um workflow/ultracode".)
>
> **Regras:** reusar skills, não reinventar; CI verde (rodar `scripts/validate_skills.py`
> + `scripts/check_doc_refs.py` antes de commitar); commitar no mesmo branch; PR draft.
>
> **Permissões MCP:** Vercel (deploy/domínio) e Figma (criar arquivo) exigem aprovação —
> me avise para eu liberar.
>
> **Meus aprendizados de outras sessões/projetos:** eu vou te passar — não presuma nem
> invente; se precisar e eu não tiver mandado, me peça.
>
> Comece lendo o HANDOFF e me proponha o plano do spike de qualidade visual.
