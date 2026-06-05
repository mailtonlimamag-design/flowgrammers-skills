#!/usr/bin/env python3
"""
Validador estrutural das skills Flowgrammers.

Sem dependencias externas (apenas biblioteca padrao do Python).
Roda no CI e localmente para garantir que cada SKILL.md siga o padrao
minimo definido no CONTRIBUTING.md e que a contagem declarada na
documentacao bata com a realidade do repositorio.

Uso:
    python3 scripts/validate_skills.py            # valida tudo
    python3 scripts/validate_skills.py --counts   # so imprime o catalogo

Saida: codigo 0 se tudo passar, 1 se houver erros.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# --- Regras (padrao "minimo real" acordado) ---------------------------------
REQUIRED_FIELDS = ("name", "description", "agents")
NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
MAX_DESC_CHARS = 1024

# Caminhos ignorados: fixtures de exemplo nao sao skills reais.
IGNORE_SUBSTRINGS = ("/assets/",)

# Dominios de topo (cada um tem um SKILL.md de indice cujo `name` pode
# divergir do nome da pasta de forma intencional).
DOMAINS = (
    "c-level-advisor",
    "engineering",
    "engineering-team",
    "marketing-skill",
    "product-team",
    "business-growth",
    "project-management",
    "finance",
    "ra-qm-team",
)


def find_skill_files() -> list[Path]:
    files = []
    for path in ROOT.rglob("SKILL.md"):
        posix = path.as_posix()
        if any(sub in posix for sub in IGNORE_SUBSTRINGS):
            continue
        files.append(path)
    return sorted(files)


def extract_frontmatter(text: str) -> list[str] | None:
    """Retorna as linhas internas do frontmatter YAML, ou None se ausente."""
    if not text.startswith("---"):
        return None
    lines = text.splitlines()
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            return lines[1:i]
    return None


def top_level_value(fm_lines: list[str], key: str) -> str | None:
    """Valor inline de uma chave de topo (coluna 0). None se ausente."""
    pattern = re.compile(rf"^{re.escape(key)}:(.*)$")
    for line in fm_lines:
        m = pattern.match(line)
        if m:
            return m.group(1).strip()
    return None


def has_top_level_key(fm_lines: list[str], key: str) -> bool:
    return top_level_value(fm_lines, key) is not None


def nested_value(fm_lines: list[str], key: str) -> str | None:
    """Valor de uma chave indentada (ex.: metadata.updated). None se ausente."""
    pattern = re.compile(rf"^\s+{re.escape(key)}:(.*)$")
    for line in fm_lines:
        m = pattern.match(line)
        if m:
            return m.group(1).strip()
    return None


def strip_quotes(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] in "\"'" and value[-1] == value[0]:
        return value[1:-1]
    return value


def is_domain_index(path: Path) -> bool:
    """True para os SKILL.md de indice no topo de cada dominio."""
    rel = path.relative_to(ROOT)
    return len(rel.parts) == 2 and rel.parts[0] in DOMAINS


def validate_file(path: Path) -> list[str]:
    errors: list[str] = []
    text = path.read_text(encoding="utf-8")
    fm = extract_frontmatter(text)

    if fm is None:
        errors.append("frontmatter YAML ausente ou nao fechado (--- ... ---)")
        return errors  # sem frontmatter nao da pra checar o resto

    # Campos obrigatorios.
    for field in REQUIRED_FIELDS:
        if not has_top_level_key(fm, field):
            errors.append(f"campo obrigatorio ausente: `{field}`")

    # Formato do name.
    raw_name = top_level_value(fm, "name")
    if raw_name is not None:
        name = strip_quotes(raw_name)
        if not NAME_RE.match(name):
            errors.append(
                f"`name` invalido: '{name}' "
                "(use apenas minusculas, numeros e hifens)"
            )
        elif not is_domain_index(path):
            dir_name = path.parent.name
            if name != dir_name:
                errors.append(
                    f"`name` ('{name}') difere do nome da pasta ('{dir_name}')"
                )

    # Tamanho da description (so quando e valor inline).
    raw_desc = top_level_value(fm, "description")
    if raw_desc and raw_desc not in ("", ">", "|", ">-", "|-"):
        desc = strip_quotes(raw_desc)
        if len(desc) > MAX_DESC_CHARS:
            errors.append(
                f"`description` excede {MAX_DESC_CHARS} chars ({len(desc)})"
            )

    # Data `updated` (quando presente) deve ser ISO YYYY-MM-DD.
    updated = nested_value(fm, "updated")
    if updated is not None:
        updated = strip_quotes(updated)
        if updated and not DATE_RE.match(updated):
            errors.append(f"`updated` mal formatado: '{updated}' (use YYYY-MM-DD)")

    return errors


def catalog() -> dict[str, int]:
    # Contagem "publica": conta todos os SKILL.md (incluindo o indice de
    # cada dominio), batendo com a distribuicao divulgada no README.
    counts: dict[str, int] = {}
    for domain in DOMAINS:
        counts[domain] = sum(1 for _ in (ROOT / domain).rglob("SKILL.md"))
    return counts


def check_doc_counts(total: int) -> list[str]:
    """Garante que o total declarado no README bata com a realidade."""
    errors: list[str] = []
    readme = ROOT / "README.md"
    if not readme.exists():
        return errors
    text = readme.read_text(encoding="utf-8")
    declared = {int(n) for n in re.findall(r"(\d+)\s+skills", text)}
    # O total real deve aparecer como uma das contagens declaradas.
    if declared and total not in declared:
        errors.append(
            f"README.md nao declara o total real de skills ({total}); "
            f"valores encontrados: {sorted(declared)}"
        )
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Valida as skills Flowgrammers.")
    parser.add_argument(
        "--counts", action="store_true", help="apenas imprime o catalogo e sai"
    )
    args = parser.parse_args()

    counts = catalog()
    total = sum(counts.values())

    if args.counts:
        print("Catalogo de skills (canonico):")
        for domain, n in counts.items():
            print(f"  {domain:<22} {n}")
        print(f"  {'TOTAL':<22} {total}")
        return 0

    files = find_skill_files()
    failures: dict[str, list[str]] = {}
    for path in files:
        errs = validate_file(path)
        if errs:
            failures[str(path.relative_to(ROOT))] = errs

    doc_errors = check_doc_counts(total)

    # Relatorio.
    print(f"Validando {len(files)} arquivos SKILL.md...")
    print(f"Total real de skills: {total}")
    print()

    if failures:
        print(f"FALHAS em {len(failures)} arquivo(s):\n")
        for rel, errs in failures.items():
            print(f"  {rel}")
            for e in errs:
                print(f"    - {e}")
        print()

    if doc_errors:
        print("FALHAS de consistencia de documentacao:\n")
        for e in doc_errors:
            print(f"  - {e}")
        print()

    if failures or doc_errors:
        print("Validacao FALHOU.")
        return 1

    print("Validacao OK — todas as skills estao em conformidade.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
