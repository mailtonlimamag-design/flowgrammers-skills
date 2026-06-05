# Política de Segurança

## Versões Suportadas

| Versão | Suporte de Segurança |
|--------|----------------------|
| 2.x    | ✓ Ativo              |
| < 2.0  | ✗ Sem suporte        |

## Reportar uma Vulnerabilidade

**Não abra issues públicas para vulnerabilidades de segurança.**

Reporte de forma privada via e-mail para: **mailton.lima.mag@gmail.com**

Inclua no e-mail:
- Descrição detalhada da vulnerabilidade
- Passos para reproduzir
- Impacto potencial
- Sugestão de correção (opcional)

**Prazo de resposta:** 48 horas úteis para confirmação, 7 dias para triagem.

## Aviso Importante: Instalação via `curl | bash`

O README documenta uma instalação rápida via:

```bash
curl -fsSL https://raw.githubusercontent.com/.../install.sh | bash
```

Este padrão executa código remoto diretamente. Para ambientes que exigem maior segurança, **recomendamos a instalação manual**:

```bash
# 1. Clone o repositório
git clone https://github.com/mailtonlimamag-design/flowgrammers-skills.git
cd flowgrammers-skills

# 2. Revise o script antes de executar
cat install.sh

# 3. Execute localmente
bash install.sh
```

## Escopo

**Em escopo:**
- Scripts de instalação (`install.sh`, `scripts/*.sh`)
- Workflows de CI/CD (`.github/workflows/`)
- Scripts de validação Python (`scripts/*.py`)

**Fora de escopo:**
- Conteúdo dos arquivos `SKILL.md` (são prompts de texto, não código executável)
- Segurança de terceiros referenciados nas skills

## Práticas de Segurança do Projeto

- `SKILL.md` são arquivos de texto puro — sem código executável
- Scripts Python usam apenas stdlib, sem dependências externas
- `.gitignore` cobre `.env`, `*.pem`, `*.key`, `secrets.*`
- ShellCheck obrigatório em CI para todos os scripts `.sh`
