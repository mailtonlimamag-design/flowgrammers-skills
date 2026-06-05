## Descrição

<!-- Descreva o que este PR faz e por quê -->

## Tipo de Mudança

- [ ] Nova skill
- [ ] Atualização de skill existente
- [ ] Novo comando slash
- [ ] Correção de bug
- [ ] Documentação
- [ ] Infraestrutura / CI / scripts

## Checklist

### Para novas skills ou atualizações de skill:
- [ ] `SKILL.md` segue o padrão de frontmatter (`name`, `description`, `author`, `agents`)
- [ ] `python3 scripts/validate_skills.py` passou sem erros
- [ ] `python3 scripts/check_doc_refs.py` passou sem erros
- [ ] Skill testada manualmente no Claude Code
- [ ] Contexto brasileiro aplicado quando relevante (LGPD, PIX, BRL, etc.)

### Para scripts e infraestrutura:
- [ ] `shellcheck --severity=warning install.sh scripts/*.sh` passou
- [ ] Script é idempotente (pode ser executado múltiplas vezes)
- [ ] Tratamento de erros adequado (`set -euo pipefail`)

### Geral:
- [ ] CI passou (validate, smoke-install, lint-docs)
- [ ] `CHANGELOG.md` atualizado (para mudanças visíveis ao usuário)

## Testes Realizados

<!-- Descreva como você testou suas mudanças -->

## Skill(s) Afetada(s)

<!-- Liste os caminhos das skills modificadas, ex: engineering-team/senior-devops/SKILL.md -->
