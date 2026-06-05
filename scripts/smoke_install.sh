#!/usr/bin/env bash
# =============================================================================
# Smoke test do install.sh — executa o instalador contra um HOME temporário
# e valida o resultado. Não toca no HOME real do usuário.
#
# Uso: bash scripts/smoke_install.sh
# Saída: 0 se tudo passar, 1 em qualquer falha.
# =============================================================================
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_HOME="$(mktemp -d)"
FAILURES=0

cleanup() { rm -rf "$TEST_HOME"; }
trap cleanup EXIT

pass() { echo "  PASS - $1"; }
fail() { echo "  FAIL - $1"; FAILURES=$((FAILURES + 1)); }

assert_exists()    { [ -e "$1" ] && pass "$2" || fail "$2 (faltando: $1)"; }
assert_missing()   { [ ! -e "$1" ] && pass "$2" || fail "$2 (presente indevidamente: $1)"; }

echo "==> Executando install.sh com HOME=$TEST_HOME"
# Responde 's' aos prompts (continuar sem claude no PATH + confirmar instalação).
if printf 's\ns\n' | HOME="$TEST_HOME" bash "$REPO_ROOT/install.sh" >/dev/null 2>&1; then
  pass "install.sh terminou com exit 0"
else
  fail "install.sh terminou com exit != 0"
fi

SKILLS_DIR="$TEST_HOME/.claude/skills"
COMMANDS_DIR="$TEST_HOME/.claude/commands"

echo "==> Validando o resultado da instalação"

# Contagem de skills bate com o repositório.
REPO_SKILLS=$(find "$REPO_ROOT" -name SKILL.md -not -path '*/.git/*' | wc -l | tr -d ' ')
INST_SKILLS=$(find "$SKILLS_DIR" -name SKILL.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$REPO_SKILLS" -eq "$INST_SKILLS" ] && [ "$INST_SKILLS" -gt 0 ]; then
  pass "skills instaladas == repositório ($INST_SKILLS)"
else
  fail "contagem de skills divergente (repo=$REPO_SKILLS instalado=$INST_SKILLS)"
fi

# Arquivos que NÃO devem ir para ~/.claude/skills/.
assert_missing "$SKILLS_DIR/scripts"        "scripts/ excluído da instalação"
assert_missing "$SKILLS_DIR/.github"        ".github/ excluído da instalação"
assert_missing "$SKILLS_DIR/install.sh"     "install.sh excluído da instalação"
assert_missing "$SKILLS_DIR/CONTRIBUTING.md" "CONTRIBUTING.md excluído da instalação"
assert_missing "$SKILLS_DIR/README.md"      "README.md excluído da instalação"

# Artefatos esperados.
assert_exists "$SKILLS_DIR/SKILLS.md"                                  "guia SKILLS.md criado"
assert_exists "$SKILLS_DIR/c-level-advisor/ceo-advisor/SKILL.md"       "skill de exemplo copiada"
assert_exists "$TEST_HOME/.claude/CLAUDE.md"                           "CLAUDE.md global criado"

# Comandos slash copiados.
if [ -d "$COMMANDS_DIR" ] && [ "$(find "$COMMANDS_DIR" -type f | wc -l)" -gt 0 ]; then
  pass "comandos slash copiados"
else
  fail "comandos slash não copiados"
fi

# Bloco Flowgrammers presente no CLAUDE.md global.
if grep -q "Flowgrammers Skills" "$TEST_HOME/.claude/CLAUDE.md" 2>/dev/null; then
  pass "CLAUDE.md contém bloco Flowgrammers"
else
  fail "CLAUDE.md sem bloco Flowgrammers"
fi

echo "==> Testando idempotência (segunda execução faz backup)"
if printf 's\ns\n' | HOME="$TEST_HOME" bash "$REPO_ROOT/install.sh" >/dev/null 2>&1; then
  pass "segunda execução terminou com exit 0"
else
  fail "segunda execução terminou com exit != 0"
fi
if find "$TEST_HOME/.claude" -maxdepth 1 -name 'skills.backup.*' | grep -q .; then
  pass "backup da instalação anterior criado"
else
  fail "backup não criado na reinstalação"
fi

echo ""
if [ "$FAILURES" -eq 0 ]; then
  echo "Smoke test OK — install.sh funciona como esperado."
  exit 0
fi
echo "Smoke test FALHOU ($FAILURES verificação(ões))."
exit 1
