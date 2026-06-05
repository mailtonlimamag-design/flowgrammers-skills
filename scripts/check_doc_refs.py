#!/usr/bin/env python3
"""
Checador de referências de documentação.

Sem dependências externas. Garante que os caminhos de skills citados na
documentação realmente existam no repositório — prevenindo regressão de
"pastas fantasma" (ex.: skills-brasileiras/, ra-qm-team/lgpd-expert).

Regras:
  A. Toda referência `~/.claude/skills/<caminho>` deve existir no repo.
  B. Todo token entre crases que comece com um domínio conhecido
     (`<dominio>/<...>`) deve existir como arquivo ou pasta no repo.
  C. Todo link markdown relativo `[texto](caminho)` na documentação
     curada deve apontar para um arquivo existente.

Nota: por decisão de projeto, os caminhos `references/...` e `scripts/...`
citados dentro dos SKILL.md são tratados como prosa (gerados sob demanda)
e NÃO são verificados — por isso a regra C cobre apenas a documentação
curada (README, CLAUDE.md, CONTRIBUTING.md, commands/), não os SKILL.md.

Uso: python3 scripts/check_doc_refs.py
Saída: 0 se tudo resolver, 1 se houver referência quebrada.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

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

# Arquivos de documentação varridos.
DOC_FILES = ["README.md", "CLAUDE.md", "CONTRIBUTING.md", "install.sh"]
DOC_GLOBS = ["commands/*.md"]

SKILLS_PREFIX_RE = re.compile(r"~/\.claude/skills/([A-Za-z0-9_./-]+)")
BACKTICK_RE = re.compile(r"`([^`]+)`")
DOMAIN_TOKEN_RE = re.compile(
    r"^(?:" + "|".join(re.escape(d) for d in DOMAINS) + r")/[A-Za-z0-9_./-]+$"
)

# Links markdown: [texto](alvo)
MD_LINK_RE = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
# Considera "caminho de arquivo" o que parece um caminho real, evitando
# placeholders de exemplo como `[texto](url)`.
PATH_SUFFIXES = (".md", ".html", ".sh", ".py", ".png", ".jpg", ".svg", ".json", ".txt")


def looks_like_path(target: str) -> bool:
    return (
        target.startswith(("./", "../"))
        or "/" in target
        or target.endswith(PATH_SUFFIXES)
    )


def collect_docs() -> list[Path]:
    docs = [ROOT / f for f in DOC_FILES if (ROOT / f).exists()]
    for pattern in DOC_GLOBS:
        docs.extend(sorted(ROOT.glob(pattern)))
    return docs


def repo_path_exists(rel: str) -> bool:
    rel = rel.strip().strip("/")
    if not rel:
        return False
    return (ROOT / rel).exists()


def check_file(path: Path) -> list[str]:
    errors: list[str] = []
    text = path.read_text(encoding="utf-8")

    # Regra A: referências ~/.claude/skills/...
    for m in SKILLS_PREFIX_RE.finditer(text):
        rel = m.group(1)
        # Normaliza "SKILLS.md" (gerado pelo instalador, não existe no repo).
        if rel in ("", "SKILLS.md"):
            continue
        if not repo_path_exists(rel):
            errors.append(f"referência inexistente: ~/.claude/skills/{rel}")

    # Regra B: tokens entre crases iniciados por um domínio conhecido.
    for m in BACKTICK_RE.finditer(text):
        token = m.group(1).strip().rstrip("/")
        if DOMAIN_TOKEN_RE.match(token) and not repo_path_exists(token):
            errors.append(f"referência inexistente: `{token}`")

    # Regra C: links markdown relativos apontando para arquivos do repo.
    for m in MD_LINK_RE.finditer(text):
        target = m.group(1).strip()
        if target.startswith(("http://", "https://", "mailto:", "tel:", "#")):
            continue
        target = target.split("#", 1)[0].split("?", 1)[0].strip()
        if not target or not looks_like_path(target):
            continue
        if not (path.parent / target).exists():
            errors.append(f"link markdown quebrado: [{target}]")

    return errors


def main() -> int:
    docs = collect_docs()
    failures: dict[str, list[str]] = {}
    seen: set[str] = set()

    for doc in docs:
        errs = []
        for e in check_file(doc):
            key = f"{doc}:{e}"
            if key in seen:
                continue
            seen.add(key)
            errs.append(e)
        if errs:
            failures[str(doc.relative_to(ROOT))] = errs

    print(f"Checando referências em {len(docs)} arquivo(s) de documentação...")
    if failures:
        print(f"\nFALHAS em {len(failures)} arquivo(s):\n")
        for rel, errs in failures.items():
            print(f"  {rel}")
            for e in errs:
                print(f"    - {e}")
        print("\nChecagem FALHOU.")
        return 1

    print("Checagem OK — todas as referências de skills resolvem.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
