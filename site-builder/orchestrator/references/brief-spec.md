# Brief Spec — As 8 perguntas

Máximo 8 perguntas. Múltipla escolha sempre que possível. Recomendações quando houver
contexto. Nunca inventar — pré-preencher só com dados fornecidos e marcar "confirme".

## Ordem (maior impacto primeiro)

As perguntas de maior entropia vêm primeiro (1 e 4), para o motor recomendar o resto.

### Q1 — Objetivo principal
- Tipo: escolha única
- Opções: `vender` · `gerar_leads` · `institucional` · `portfolio` · `lancamento`
- Alimenta: arquétipo de template, estratégia de CTA, estrutura de seções
- Recomendação: nenhuma (é a âncora do fluxo)

### Q2 — "O que você faz, em uma frase"
- Tipo: campo aberto curto (único aberto do brief)
- Pré-preenche: se houver nome/site/redes fornecidos, sugerir e pedir confirmação
- Guardrail: extrair entidades reais; nunca completar com suposições de mercado
- Alimenta: copy + palavras-chave SEO

### Q3 — Quem é seu cliente
- Tipo: escolha única
- Opções: `b2b_nacional` · `b2b_local` · `b2c_nacional` · `b2c_local` · `nicho_premium`
- Alimenta: registro de linguagem, tipo de prova social, tom

### Q4 — Personalidade da marca (mood-board)
- Tipo: multi-seleção visual (1–2)
- Opções: `minimalista` · `ousado` · `corporativo` · `humano` · `tecnico` · `artesanal`
- Apresentação: thumbnails de mundos de estilo, não palavras soltas
- Alimenta: design tokens (cor, tipografia, imagem) — coração do "não-IA"

### Q5 — Tom de voz
- Tipo: escolha em matriz 2×2
- Eixos: `formalidade` (formal↔casual) × `seriedade` (serio↔divertido)
- Alimenta: voz da copy (reusa matriz de tom de `marketing-skill/brand-guidelines`)

### Q6 — Referências que admira
- Tipo: opcional — 1–3 URLs OU seleção de exemplos premium curados
- Se vazio: recomendar referências derivadas de Q4 (marcadas como sugestão)
- Guardrail: nunca afirmar que o cliente "gosta" de algo que não indicou
- Alimenta: ancoragem estética (anti-genérico)

### Q7 — Ativos que já possui
- Tipo: multi-seleção
- Opções: `logo` · `fotos` · `depoimentos` · `numeros` · `cases` · `nenhum`
- Alimenta: o que é real vs. precisa ser gerado; evita forjar credibilidade
- Regra: se `numeros`/`depoimentos` ausentes, NÃO inventar provas — usar placeholders honestos

### Q8 — Domínio
- Tipo: escolha + input condicional
- Opções: `ja_tenho` (input) · `quero_sugestoes` (input: nome do negócio) · `decidir_depois`
- Alimenta: checagem GoDaddy + Vercel (fonte dupla); nunca assumir disponibilidade

## Lógica de recomendação

- Com contexto prévio (nome, domínio, redes, site atual): pré-preencher Q2, Q3, Q8 e
  exibir como "confirme isto".
- Sem contexto: recomendar defaults derivados de Q1 + Q4.
- Toda recomendação é rotulada como sugestão — o cliente confirma ou troca.

## Guardrails (nunca inventar)

1. Só preencher campo com dado fornecido pelo cliente.
2. Inferência → rotular "confirme", nunca apresentar como fato.
3. Dúvida → perguntar, não chutar.
4. Sem provas reais (Q7) → placeholder honesto, jamais número/depoimento fabricado.
