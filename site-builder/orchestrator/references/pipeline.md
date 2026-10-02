# Pipeline — Contrato de entrada/saída por etapa

Cada etapa recebe um input estruturado e produz um output que alimenta a próxima.
O orchestrator invoca a skill responsável, captura o output e passa adiante.
Nenhuma etapa inventa dados ausentes — campos sem fonte ficam marcados `// confirmar`.

## Convenção

- Estado compartilhado: um objeto `model` (mesmo formato de `spikes/site-builder/model.json`).
- Cada etapa só escreve nas suas chaves; nunca sobrescreve as de outra.

## Etapas

### [1] PM — `product-team/product-manager-toolkit`
- In: `brief.q1_objetivo`, `brief.q3_cliente`
- Out: `model.estrutura_site.secoes`, métrica de sucesso, escopo
- Regra: estrutura de seções deriva do objetivo (ver tabela do spike `generate.ts`)

### [2] Brand — `marketing-skill/brand-guidelines`
- In: `brief.q2`, `brief.q4_personalidade`, `brief.q5_tom`
- Out: `model.brand.posicionamento`, `model.brand.do_list/dont_list`, mood
- Regra: posicionamento usa só a frase do cliente (Q2); nada de claims inventados

### [3] Design System — `product-team/ui-design-system`
- In: `brief.q4_personalidade`, `model.brand.mood`
- Out: `model.design_tokens` (cores, tipografia, espaçamento)
- Nota: candidatos de paleta/tipografia podem ir a torneio (agenthub) quando Q4 tem 2 personalidades em tensão

### [4] Copy — `marketing-skill/copywriting`
- In: `brief.q2`, `brief.q5_tom`, `model.estrutura_site.secoes`
- Out: textos por seção, `model.brand.tagline`, `model.brand.exemplo_copy`
- Nota: headline pode ir a torneio (A/B) via agenthub

### [5] SEO/GEO — `marketing-skill/ai-seo` + `marketing-skill/seo-audit`
- In: `brief.q2`, `brief.q3`, `model.brand.nome`
- Out: `model.seo.title_tag`, `meta_description`, `keywords`, `citabilidade_frase`

### [6] Domínio — checagem fonte dupla
- In: `brief.q8`, `model.brand.nome`
- Tools: GoDaddy MCP (`domains_check_availability`, `domains_suggest`) + Vercel MCP
  (`check_domain_availability_and_price`)
- Out: `model.dominio.slugs_sugeridos` + status real de cada um
- Regra: nunca marcar disponível sem checar; oferecer alternativas se indisponível

### [7] Frontend / Preview — `engineering-team/senior-frontend` + `product-team/landing-page-generator`
- In: `model` completo
- Out: preview (Figma frame + URL Vercel) + one-pager.html
- Gate: para aqui até aprovação do cliente

### [8] Build completo (pós-aprovação)
- In: `model` aprovado
- Out: site Next.js deployado na Vercel + domínio conectado
- Só dispara com `state = approved`

## Passos delegados à agenthub (torneio)

| Passo | Quando | Critério de avaliação |
|-------|--------|----------------------|
| Direção visual do hero | sempre | juiz LLM: qualidade premium + fidelidade ao brief |
| Paleta candidata | Q4 com 2 personalidades | juiz LLM: harmonia + contraste/acessibilidade |
| Headline | objetivo = vender/gerar_leads | juiz LLM: clareza + conversão |

Mecânica: `/hub:init → /hub:spawn → /hub:eval → /hub:merge`. O orchestrator lê
`results/` e escreve o vencedor no `model`.
