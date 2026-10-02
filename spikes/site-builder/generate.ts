#!/usr/bin/env npx ts-node
/**
 * Site Builder Spike — gerador ponta-a-ponta
 * Input:  brief.json
 * Output: model.json  +  preview/index.html  +  one-pager.html
 *
 * Regra: tudo é determinístico a partir do brief. Zero IA neste arquivo.
 * Zero banco. Só mapeamento de tabelas.
 */

import * as fs from "fs";
import * as path from "path";

// ─── tipos ────────────────────────────────────────────────────────────────────

interface Brief {
  meta: { created_at: string; spike: string; note: string };
  q1_objetivo: string;
  q2_frase_negocio: string;
  q3_cliente: string;
  q4_personalidade: string[];
  q5_tom: { formalidade: string; seriedade: string };
  q6_referencias: string[];
  q7_ativos: string[];
  q8_dominio: { status: string; nome_negocio: string };
}

interface ContentModel {
  brand: {
    nome: string;
    tagline: string;
    posicionamento: string;
    tom_keywords: string[];
    do_list: string[];
    dont_list: string[];
    exemplo_copy: string;
  };
  design_tokens: {
    cores: { primaria: string; secundaria: string; acento: string; fundo: string; texto: string };
    tipografia: { titulo: string; corpo: string };
    mood: string[];
  };
  seo: {
    title_tag: string;
    meta_description: string;
    keywords: string[];
    citabilidade_frase: string;
  };
  estrutura_site: { secoes: string[] };
  dominio: { nome_negocio: string; slugs_sugeridos: string[] };
  ativos_disponiveis: string[];
}

// ─── tabelas de lookup (determinísticas) ──────────────────────────────────────

const OBJETIVO_MAP: Record<string, { tagline_suffix: string; cta: string; secoes: string[] }> = {
  gerar_leads: {
    tagline_suffix: "Resultados financeiros que transformam negócios.",
    cta: "Solicite uma análise gratuita",
    secoes: ["hero", "problema", "solucao", "como_funciona", "depoimentos", "numeros", "faq", "cta_final"],
  },
  vender: {
    tagline_suffix: "A solução certa para o seu negócio.",
    cta: "Comprar agora",
    secoes: ["hero", "produto", "beneficios", "depoimentos", "precos", "faq", "cta_final"],
  },
  institucional: {
    tagline_suffix: "Conheça quem somos.",
    cta: "Saiba mais",
    secoes: ["hero", "sobre", "valores", "equipe", "clientes", "contato"],
  },
  portfolio: {
    tagline_suffix: "Nosso trabalho fala por si.",
    cta: "Ver portfólio",
    secoes: ["hero", "sobre", "casos", "processo", "contato"],
  },
  lancamento: {
    tagline_suffix: "Em breve. Reserve seu lugar.",
    cta: "Quero ser avisado",
    secoes: ["hero", "o_que_e", "beneficios", "conta_regressiva", "pre_cadastro"],
  },
};

const PERSONALIDADE_TOKENS: Record<string, { primaria: string; acento: string; mood: string }> = {
  corporativo: { primaria: "#1B2B4B", acento: "#2563EB", mood: "confiança" },
  humano:      { primaria: "#2D3748", acento: "#38A169", mood: "proximidade" },
  minimalista: { primaria: "#111827", acento: "#6B7280", mood: "elegância" },
  ousado:      { primaria: "#1A1A2E", acento: "#E94560", mood: "energia" },
  tecnico:     { primaria: "#0F172A", acento: "#0EA5E9", mood: "precisão" },
  artesanal:   { primaria: "#3D2B1F", acento: "#D97706", mood: "autenticidade" },
};

const TOM_MAP: Record<string, Record<string, string[]>> = {
  formal: {
    serio:     ["Claro e preciso", "Baseado em dados", "Sem jargões desnecessários"],
    divertido: ["Profissional com leveza", "Direto e acolhedor", "Nunca impessoal"],
  },
  casual: {
    serio:     ["Próximo e honesto", "Sem enrolação", "Foco em resultados"],
    divertido: ["Descontraído e humano", "Histórias reais", "Zero corporativês"],
  },
};

const DONTS_MAP: Record<string, string[]> = {
  formal: ["Gírias ou abreviações", "Excessos de exclamação", "Linguagem vaga"],
  casual: ["Jargões técnicos sem explicação", "Formalidade excessiva", "Copy genérico"],
};

// ─── função principal ─────────────────────────────────────────────────────────

function buildModel(brief: Brief): ContentModel {
  const obj = OBJETIVO_MAP[brief.q1_objetivo] ?? OBJETIVO_MAP["institucional"];

  // design tokens — combina as personalidades (pega a 1ª como base, 2ª como acento se disponível)
  const p1 = PERSONALIDADE_TOKENS[brief.q4_personalidade[0]] ?? PERSONALIDADE_TOKENS["corporativo"];
  const p2 = brief.q4_personalidade[1]
    ? PERSONALIDADE_TOKENS[brief.q4_personalidade[1]]
    : null;

  const tokens = {
    cores: {
      primaria:  p1.primaria,
      secundaria: p2 ? p2.primaria : "#374151",
      acento:    p2 ? p2.acento : p1.acento,
      fundo:     "#F9FAFB",
      texto:     "#111827",
    },
    tipografia: {
      titulo: brief.q4_personalidade.includes("artesanal") ? "Playfair Display" : "Inter",
      corpo:  "Inter",
    },
    mood: [p1.mood, ...(p2 ? [p2.mood] : [])],
  };

  // tom
  const formalidade = brief.q5_tom.formalidade as "formal" | "casual";
  const seriedade   = brief.q5_tom.seriedade   as "serio"  | "divertido";
  const tom_keywords = TOM_MAP[formalidade]?.[seriedade] ?? TOM_MAP["formal"]["serio"];
  const dont_list    = DONTS_MAP[formalidade] ?? DONTS_MAP["formal"];

  // posicionamento
  const nome = brief.q8_dominio.nome_negocio;
  const posicionamento = `${nome} é uma ${brief.q2_frase_negocio.split(".")[0].toLowerCase()}.`;

  // SEO
  const keyword_base = nome.toLowerCase().replace(/\s+/g, "-");
  const keywords = [
    keyword_base,
    `consultoria financeira pme`,
    `gestao financeira empresas`,
    `saude financeira negocio`,
  ];

  // domínio — slugs limpos (first word = marca curta, base = nome completo)
  const slug_base  = nome.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
  const slug_short = nome.toLowerCase().split(/\s+/)[0].replace(/[^a-z0-9]/g, "");
  const slugs = [
    `${slug_base}.com.br`,
    `${slug_base}.com`,
    `${slug_short}consult.com.br`,
    `${slug_short}consult.com`,
  ];

  return {
    brand: {
      nome,
      tagline: obj.tagline_suffix,
      posicionamento,
      tom_keywords,
      do_list:      tom_keywords,
      dont_list,
      exemplo_copy: `${nome}: ${obj.tagline_suffix}`,
    },
    design_tokens: tokens,
    seo: {
      title_tag:        `${nome} | Consultoria Financeira para PMEs`,
      meta_description: brief.q2_frase_negocio,
      keywords,
      citabilidade_frase: `${nome} oferece consultoria financeira especializada para pequenas e médias empresas no Brasil.`,
    },
    estrutura_site: { secoes: obj.secoes },
    dominio: { nome_negocio: nome, slugs_sugeridos: slugs },
    ativos_disponiveis: brief.q7_ativos,
  };
}

// ─── geração de HTML ──────────────────────────────────────────────────────────

function generatePreview(model: ContentModel): string {
  const { brand, design_tokens: dt, seo, estrutura_site } = model;
  const secoesHtml = estrutura_site.secoes
    .map((s) => `<li style="padding:4px 0;color:#6B7280;font-size:14px;">• ${s.replace(/_/g, " ")}</li>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${seo.title_tag}</title>
  <meta name="description" content="${seo.meta_description}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: '${dt.tipografia.corpo}', sans-serif; background: ${dt.cores.fundo}; color: ${dt.cores.texto}; }
    .hero {
      background: ${dt.cores.primaria};
      color: #fff;
      padding: 80px 40px;
      text-align: center;
    }
    .hero h1 { font-size: clamp(28px, 5vw, 52px); font-weight: 700; margin-bottom: 16px; }
    .hero p  { font-size: 18px; opacity: .8; max-width: 560px; margin: 0 auto 32px; }
    .cta {
      display: inline-block;
      background: ${dt.cores.acento};
      color: #fff;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
    }
    .tokens-section { max-width: 900px; margin: 60px auto; padding: 0 24px; }
    .tokens-section h2 { font-size: 20px; font-weight: 700; margin-bottom: 20px; color: ${dt.cores.primaria}; }
    .swatches { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
    .swatch { width: 60px; height: 60px; border-radius: 8px; display: flex; align-items: flex-end; padding: 4px; }
    .swatch span { font-size: 9px; color: rgba(255,255,255,.8); word-break: break-all; }
    .meta-box { background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .meta-box h3 { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px; text-transform: uppercase; letter-spacing: .5px; }
    .meta-box p  { font-size: 14px; color: #6B7280; line-height: 1.6; }
    .tag-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .tag { background: #EFF6FF; color: ${dt.cores.acento}; padding: 4px 12px; border-radius: 20px; font-size: 13px; }
    .secoes-list { list-style: none; }
    footer { text-align: center; padding: 40px; color: #9CA3AF; font-size: 13px; }
    .spike-badge {
      position: fixed; bottom: 16px; right: 16px;
      background: #FBBF24; color: #1F2937;
      padding: 6px 14px; border-radius: 20px;
      font-size: 12px; font-weight: 700;
    }
  </style>
</head>
<body>

  <section class="hero">
    <h1>${brand.nome}</h1>
    <p>${brand.tagline}</p>
    <a class="cta" href="#contato">Solicite uma análise gratuita</a>
  </section>

  <div class="tokens-section">

    <h2>Design Tokens — derivados do brief</h2>

    <div class="swatches">
      <div class="swatch" style="background:${dt.cores.primaria}"><span>${dt.cores.primaria}</span></div>
      <div class="swatch" style="background:${dt.cores.secundaria}"><span>${dt.cores.secundaria}</span></div>
      <div class="swatch" style="background:${dt.cores.acento}"><span>${dt.cores.acento}</span></div>
      <div class="swatch" style="background:${dt.cores.fundo};border:1px solid #E5E7EB"><span style="color:#9CA3AF">${dt.cores.fundo}</span></div>
    </div>

    <div class="meta-box">
      <h3>Posicionamento</h3>
      <p>${brand.posicionamento}</p>
    </div>

    <div class="meta-box">
      <h3>Tom de Voz</h3>
      <div class="tag-list">
        ${brand.tom_keywords.map((t) => `<span class="tag">${t}</span>`).join("")}
      </div>
    </div>

    <div class="meta-box">
      <h3>SEO — Title Tag</h3>
      <p>${seo.title_tag}</p>
      <p style="margin-top:8px">${seo.meta_description}</p>
    </div>

    <div class="meta-box">
      <h3>Palavras-chave</h3>
      <div class="tag-list">
        ${seo.keywords.map((k) => `<span class="tag">${k}</span>`).join("")}
      </div>
    </div>

    <div class="meta-box">
      <h3>Estrutura do Site (${estrutura_site.secoes.length} seções)</h3>
      <ul class="secoes-list">
        ${secoesHtml}
      </ul>
    </div>

    <div class="meta-box">
      <h3>Frase de citabilidade (GEO)</h3>
      <p><em>${seo.citabilidade_frase}</em></p>
    </div>

    <div class="meta-box">
      <h3>Domínios sugeridos</h3>
      <div class="tag-list">
        ${model.dominio.slugs_sugeridos.map((d) => `<span class="tag">${d}</span>`).join("")}
      </div>
      <p style="margin-top:12px;font-size:12px;color:#9CA3AF">Disponibilidade real checada via GoDaddy + Vercel — veja README.md</p>
    </div>

  </div>

  <footer>Spike site-builder — gerado automaticamente a partir de brief.json | Flowgrammers</footer>
  <span class="spike-badge">⚡ SPIKE</span>

</body>
</html>`;
}

function generateOnePager(model: ContentModel): string {
  const { brand, design_tokens: dt, seo, dominio } = model;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Manual Visual — ${brand.nome}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Inter', sans-serif; margin: 0; background: #fff; color: #111; }
    .page {
      max-width: 800px; margin: 0 auto; padding: 48px 40px;
      border: 1px solid #E5E7EB;
    }
    h1 { font-size: 36px; font-weight: 900; color: ${dt.cores.primaria}; margin: 0 0 4px; }
    .tagline { font-size: 16px; color: ${dt.cores.acento}; font-weight: 600; margin-bottom: 32px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .block { border-left: 3px solid ${dt.cores.acento}; padding-left: 16px; }
    .block h2 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9CA3AF; margin-bottom: 8px; }
    .block p  { font-size: 14px; line-height: 1.6; color: #374151; }
    .swatches { display: flex; gap: 8px; margin-top: 6px; }
    .sw { width: 28px; height: 28px; border-radius: 4px; }
    .tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
    .tag { background: #F3F4F6; padding: 3px 10px; border-radius: 12px; font-size: 12px; color: #374151; }
    .divider { border: none; border-top: 1px solid #E5E7EB; margin: 28px 0; }
    .footer-note { font-size: 11px; color: #9CA3AF; margin-top: 32px; }
  </style>
</head>
<body>
<div class="page">
  <h1>${brand.nome}</h1>
  <p class="tagline">${brand.tagline}</p>

  <div class="grid">

    <div class="block">
      <h2>Posicionamento</h2>
      <p>${brand.posicionamento}</p>
    </div>

    <div class="block">
      <h2>Identidade Visual</h2>
      <div class="swatches">
        <div class="sw" style="background:${dt.cores.primaria}" title="${dt.cores.primaria}"></div>
        <div class="sw" style="background:${dt.cores.secundaria}" title="${dt.cores.secundaria}"></div>
        <div class="sw" style="background:${dt.cores.acento}" title="${dt.cores.acento}"></div>
        <div class="sw" style="background:${dt.cores.fundo};border:1px solid #E5E7EB" title="${dt.cores.fundo}"></div>
      </div>
      <p style="margin-top:8px;font-size:12px;color:#6B7280">Tipografia: <strong>${dt.tipografia.titulo}</strong> — Mood: ${dt.mood.join(" · ")}</p>
    </div>

    <div class="block">
      <h2>Tom de Voz — Do</h2>
      <div class="tags">${brand.do_list.map((t) => `<span class="tag">✓ ${t}</span>`).join("")}</div>
    </div>

    <div class="block">
      <h2>Tom de Voz — Don't</h2>
      <div class="tags">${brand.dont_list.map((t) => `<span class="tag">✗ ${t}</span>`).join("")}</div>
    </div>

  </div>

  <hr class="divider" />

  <div class="grid">

    <div class="block">
      <h2>SEO / GEO — Title Tag</h2>
      <p>${seo.title_tag}</p>
      <p style="margin-top:8px;font-size:12px;color:#6B7280">${seo.meta_description}</p>
    </div>

    <div class="block">
      <h2>Citabilidade (GEO)</h2>
      <p><em>${seo.citabilidade_frase}</em></p>
    </div>

    <div class="block">
      <h2>Domínios sugeridos</h2>
      <div class="tags">${dominio.slugs_sugeridos.map((d) => `<span class="tag">${d}</span>`).join("")}</div>
    </div>

    <div class="block">
      <h2>Keywords</h2>
      <div class="tags">${seo.keywords.map((k) => `<span class="tag">${k}</span>`).join("")}</div>
    </div>

  </div>

  <p class="footer-note">Manual Visual Estratégico — gerado automaticamente a partir do brief | Flowgrammers Site Builder Spike</p>
</div>
</body>
</html>`;
}

// ─── entrypoint ───────────────────────────────────────────────────────────────

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const dir = path.dirname(__filename);
const briefPath   = path.join(dir, "brief.json");
const modelPath   = path.join(dir, "model.json");
const previewPath = path.join(dir, "preview", "index.html");
const onePagerPath = path.join(dir, "one-pager.html");

const brief: Brief = JSON.parse(fs.readFileSync(briefPath, "utf-8"));
const model: ContentModel = buildModel(brief);

fs.writeFileSync(modelPath, JSON.stringify(model, null, 2));
fs.writeFileSync(previewPath, generatePreview(model));
fs.writeFileSync(onePagerPath, generateOnePager(model));

console.log("✓ model.json");
console.log("✓ preview/index.html");
console.log("✓ one-pager.html");
console.log("");
console.log("Domínios sugeridos para checagem:");
model.dominio.slugs_sugeridos.forEach((s) => console.log(" -", s));
