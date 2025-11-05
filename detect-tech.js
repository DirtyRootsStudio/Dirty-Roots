/**
 * detect-tech.js v1.3
 *
 * Script para detectar de forma heurística la tecnología usada en una web:
 * - inspecciona cabeceras HTTP
 * - busca patrones en el HTML (wp-content, __NEXT_DATA__, __NUXT__, etc.)
 * - prueba endpoints públicos comunes (/wp-json/, /wp-login.php, /_next/static/, /cart.js, ...)
 *
 * Uso:
 *   1) npm init -y
 *   2) npm i axios cheerio
 *   3) node detect-tech.js https://ejemplo.com [--json] [--brief] [--no-endpoints] [--timeout=8000] [--log]
 *
 * Nota: Solo realiza peticiones GET a rutas públicas. No hace escaneo agresivo.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// ───────────────────────────────────────────────────────────────────────────────
// Args & utilidades
// ───────────────────────────────────────────────────────────────────────────────

if (process.argv.length < 3) {
  console.error('Uso: node detect-tech.js <URL> [--json] [--brief] [--no-endpoints] [--timeout=8000] [--log]');
  process.exit(1);
}

const rawUrlArg = process.argv[2];
const target = rawUrlArg.replace(/\/+$/, ''); // quitar slash final si viene
const args = new Set(process.argv.slice(3));
const ARGSTR = process.argv.slice(3).join(' ');

const JSON_ONLY = args.has('--json');
const BRIEF = args.has('--brief');
const SKIP_ENDPOINTS = args.has('--no-endpoints');

const timeoutMatch = /--timeout=(\d+)/.exec(ARGSTR);
const TIMEOUT_MS = timeoutMatch ? Number(timeoutMatch[1]) : 8000;

function hostnameFrom(urlStr) {
  try {
    const u = new URL(urlStr);
    return (u.hostname || '').replace(/^www\./i, '');
  } catch {
    return 'site';
  }
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// ───────────────────────────────────────────────────────────────────────────────
// Logging a TXT (misma carpeta)
//   - por defecto: detect-tech-output.txt (overwrite)
//   - con --log: detect-tech-<host>-YYYYMMDD-HHmmss.txt
// ───────────────────────────────────────────────────────────────────────────────

const wantPerSiteLog = args.has('--log');
const logFilename = wantPerSiteLog
  ? `detect-tech-${hostnameFrom(target)}-${timestamp()}.txt`
  : 'detect-tech-output.txt';

const logPath = path.join(__dirname, logFilename);
const outputStream = fs.createWriteStream(logPath, { flags: 'w' });

const origLog = console.log;
const origErr = console.error;

console.log = (...msgs) => {
  const line = msgs.map(String).join(' ') + '\n';
  try { outputStream.write(line); } catch {}
  origLog(...msgs);
};
console.error = (...msgs) => {
  const line = '[ERROR] ' + msgs.map(String).join(' ') + '\n';
  try { outputStream.write(line); } catch {}
  origErr(...msgs);
};

process.on('exit', () => {
  try { outputStream.end(); } catch {}
  if (!JSON_ONLY && !BRIEF) {
    origLog(`\n📄 Resultado guardado en ${logPath}`);
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// Banner
// ───────────────────────────────────────────────────────────────────────────────

console.log('detect-tech.js v1.3 • heurística plataformas (Squarespace/Shopify/Webflow/Wix) activada');
console.log('Analizando:', target);

// ───────────────────────────────────────────────────────────────────────────────
// Config
// ───────────────────────────────────────────────────────────────────────────────

const endpoints = [
  '/',                  // homepage (ya se pedirá)
  '/wp-login.php',
  '/wp-admin/',
  '/wp-json/',
  '/_next/static/',
  '/_next/data/',
  '/_nuxt/',
  '/cart.js',           // Shopify
  '/administrator/',    // Joomla admin
  '/sites/default/',    // Drupal
  '/robots.txt',
  '/sitemap.xml',
];

const htmlPatterns = [
  { name: 'wp-content', re: /wp-content/i },
  { name: 'wp-json', re: /wp-json/i },
  { name: 'wp-login', re: /wp-login\.php/i },
  { name: 'wordpress generator', re: /<meta[^>]+name=["']generator["'][^>]+content=["']WordPress/i },
  { name: 'yoast', re: /yoast/i },
  { name: 'woocommerce', re: /woocommerce/i },
  { name: '__NEXT_DATA__', re: /__NEXT_DATA__/i },
  { name: 'id="__next"', re: /id=["']__next["']/i },
  { name: 'id="__nuxt"', re: /id=["']__nuxt["']/i },
  { name: '__NUXT__', re: /__NUXT__/i },
  { name: 'shopify CDN', re: /cdn\.shopify\.com/i },
  // OJO: quitamos patrón débil de Magento (mage-) para evitar falsos positivos
  { name: 'wp-emoji', re: /wp-emoji/i },
  { name: 'elementor', re: /elementor/i },
  { name: 'ghost', re: /content=["']Ghost/i },
];

// ───────────────────────────────────────────────────────────────────────────────
// Helpers HTTP
// ───────────────────────────────────────────────────────────────────────────────

function inspectHeaders(headers) {
  const found = [];
  const h = Object.keys(headers || {}).reduce((acc, k) => {
    acc[k.toLowerCase()] = headers[k];
    return acc;
  }, {});
  if (h['x-powered-by']) found.push({ header: 'x-powered-by', value: h['x-powered-by'] });
  if (h['server'])       found.push({ header: 'server', value: h['server'] });
  if (h['x-generator'])  found.push({ header: 'x-generator', value: h['x-generator'] });
  if (h['via'])          found.push({ header: 'via', value: h['via'] });
  if (h['cf-ray'] || h['cf-cache-status']) found.push({ header: 'cloudflare', value: 'cf headers' });
  return found;
}

async function safeGet(url, opts = {}) {
  try {
    const res = await axios.get(url, {
      timeout: TIMEOUT_MS,
      maxRedirects: 5,
      validateStatus: () => true,
      headers: {
        'user-agent': 'TechDetect/1.3 (+https://github.com)',
        ...((opts && opts.headers) || {}),
      },
      ...opts,
    });
    return { status: res.status, headers: res.headers, data: res.data };
  } catch (err) {
    return { error: String(err) };
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────────

(async () => {
  const report = { target, checks: [], evidence: [], score: 0 };

  // 1) Homepage
  const home = await safeGet(target + '/');
  if (home.error) {
    console.error('Error al pedir la página:', home.error);
    if (JSON_ONLY) console.log(JSON.stringify({ error: home.error, target }, null, 2));
    process.exit(2);
  }

  // Cabeceras
  const headerFinds = inspectHeaders(home.headers || {});
  if (headerFinds.length) {
    report.evidence.push({ type: 'headers', details: headerFinds });
    report.score += headerFinds.length * 2;
  }

  // HTML
  const html = typeof home.data === 'string' ? home.data : '';
  const $ = cheerio.load(html || '');

  // Patrones directos en HTML
  const htmlMatches = [];
  htmlPatterns.forEach(p => {
    if (p.re.test(html)) htmlMatches.push(p.name);
  });

  // Scripts y links (src/href)
  const scripts = $('script[src]').map((_, el) => $(el).attr('src')).get();
  const links   = $('link[href]').map((_, el) => $(el).attr('href')).get();

  // Chequeos rápidos por marcas conocidas
  if (html.includes('__NEXT_DATA__') || /id=["']__next["']/.test(html)) htmlMatches.push('next.js');
  if (html.includes('__NUXT__')      || /id=["']__nuxt["']/.test(html)) htmlMatches.push('nuxt.js/vue');
  if (/<meta[^>]+name=["']generator["'][^>]+content=["']Drupal/i.test(html)) htmlMatches.push('drupal');

  if (scripts.some(s => s && s.includes('_next'))) htmlMatches.push('next-static');
  if (scripts.some(s => s && s.includes('_nuxt'))) htmlMatches.push('nuxt-static');
  if (scripts.some(s => s && /wp-content/i.test(s))) htmlMatches.push('wp-content-script');
  if (links.some(l => l && /cdn\.shopify\.com/i.test(l))) htmlMatches.push('shopify-cdn');

  // Heurísticas por dominios/CDN (plataformas)
  const allUrls = scripts.concat(links).filter(Boolean);
  const headerValues = headerFinds.map(h => (h.value || '').toString());

  const isSquarespace =
    headerValues.some(v => /squarespace/i.test(v)) ||
    allUrls.some(u => /(assets|static\d*)\.squarespace\.com|squarespace-cdn|sqspcdn/i.test(u));

  const isShopify =
    allUrls.some(u => /cdn\.shopify\.com|myshopify\.com/i.test(u));

  const isWebflow =
    allUrls.some(u => /webflow\.io|webflow\.com|webflow-prod|wf\.[a-z]/i.test(u));

  const isWix =
    allUrls.some(u => /wixstatic\.com|wix\.com|static\.parastorage\.com/i.test(u)) ||
    /X-Wix-Request-Id/i.test(JSON.stringify(home.headers || {}));

  // Magento (más estricto)
  const looksMagento =
    links.some(l => /\/static\/frontend\/[^/]+\/[^/]+\/[^/]+\/[^/]+\.(css|js)/i.test(l || '')) ||
    /mage-/.test(String(home.headers?.['set-cookie'] || ''));

  if (htmlMatches.length) {
    report.evidence.push({ type: 'html-patterns', details: [...new Set(htmlMatches)] });
    report.score += htmlMatches.length * 3;
  }

  // 2) Endpoints comunes (opcional)
  const endpointChecks = [];
  if (!SKIP_ENDPOINTS) {
    for (const ep of endpoints) {
      if (ep === '/') continue; // ya hecha
      const url = target + ep;
      const res = await safeGet(url);
      if (res.error) {
        endpointChecks.push({ endpoint: ep, status: 'error', error: res.error });
        continue;
      }
      const body = typeof res.data === 'string' ? res.data : '';
      const clues = [];
      if (/wordpress/i.test(body) || /wp-content/i.test(body)) clues.push('wordpress');
      if (/cart\.js/i.test(body)) clues.push('shopify-cartjs');
      if (res.headers && res.headers['server'] && /nginx|apache/i.test(res.headers['server']))
        clues.push('server:' + res.headers['server']);
      endpointChecks.push({ endpoint: ep, status: res.status || 'err', clues });
      if (clues.length) {
        report.evidence.push({ type: 'endpoint', endpoint: ep, clues });
        report.score += clues.length * 2;
      }
    }
  }
  report.checks.push({ homepageStatus: home.status, endpointChecks });

  // 3) Heurística final
  const results = [];

  // Plataformas primero (más concluyentes)
  if (isSquarespace) {
    results.push({ tech: 'Squarespace', confidence: 0.9 });
    report.evidence.push({ type: 'platform', details: ['squarespace (headers/CDN)'] });
    report.score += 12;
  }
  if (isShopify) {
    results.push({ tech: 'Shopify', confidence: 0.85 });
    report.evidence.push({ type: 'platform', details: ['shopify (cdn/domains)'] });
    report.score += 10;
  }
  if (isWebflow) {
    results.push({ tech: 'Webflow', confidence: 0.7 });
    report.evidence.push({ type: 'platform', details: ['webflow (cdn/domains)'] });
    report.score += 6;
  }
  if (isWix) {
    results.push({ tech: 'Wix', confidence: 0.7 });
    report.evidence.push({ type: 'platform', details: ['wix (headers/cdn)'] });
    report.score += 6;
  }
  if (looksMagento) {
    results.push({ tech: 'Magento', confidence: 0.65 });
    report.evidence.push({ type: 'platform', details: ['magento (static/frontend or cookies)'] });
    report.score += 6;
  }

  // CMS/Frameworks habituales
  const hasWp =
    htmlMatches.includes('wp-content') ||
    endpointChecks.some(e => e.clues && e.clues.includes('wordpress')) ||
    headerFinds.some(h => /wordpress|wp-engine/i.test((h.value || '').toString()));
  if (hasWp) {
    results.push({ tech: 'WordPress', confidence: 0.8 });
    report.score += 5;
  }

  const hasNext =
    htmlMatches.includes('next.js') ||
    htmlMatches.includes('next-static') ||
    scripts.some(s => s && s.includes('_next'));
  if (hasNext) {
    results.push({ tech: 'Next.js (React)', confidence: 0.75 });
    report.score += 4;
  }

  const hasNuxt =
    htmlMatches.includes('nuxt.js/vue') ||
    htmlMatches.includes('nuxt-static') ||
    scripts.some(s => s && s.includes('_nuxt'));
  if (hasNuxt) {
    results.push({ tech: 'Nuxt (Vue)', confidence: 0.75 });
    report.score += 4;
  }

  const hasDrupal =
    htmlMatches.includes('drupal') ||
    endpointChecks.some(e => e.endpoint === '/sites/default/' && e.status >= 200 && e.status < 400);
  if (hasDrupal) {
    results.push({ tech: 'Drupal', confidence: 0.6 });
    report.score += 3;
  }

  if (htmlMatches.includes('ghost')) {
    results.push({ tech: 'Ghost', confidence: 0.6 });
    report.score += 3;
  }

  // Si no hay resultados pero una plataforma fuerte está detectada (por seguridad)
  if (!results.length && isSquarespace) {
    results.push({ tech: 'Squarespace', confidence: 0.9 });
  }

  // Ordenar por confianza y completar informe
  report.results = results.sort((a, b) => b.confidence - a.confidence);
  report.raw = { headers: home.headers, title: $('title').text(), scripts, links };
  report.confidence_score = Math.min(100, Math.round(report.score * 6));

  // Salidas según flags
  if (JSON_ONLY) {
    console.log(JSON.stringify(report, null, 2));
    const top = report.results?.[0];
    process.exit(top && top.confidence >= 0.6 ? 0 : 1);
  }

  if (BRIEF) {
    const top = report.results?.[0];
    console.log(top ? `${top.tech} ~${Math.round(top.confidence * 100)}%` : 'unknown');
    process.exit(top && top.confidence >= 0.6 ? 0 : 1);
  }

  // Salida resumida + JSON detalle
  console.log('--- Informe resumido ---');
  console.log('Título HTML:', report.raw.title || '(sin título)');
  console.log(
    'Pistas encontradas:',
    report.evidence.map(e => e.type + (e.endpoint ? ' ' + e.endpoint : '')).join(', ') || 'ninguna'
  );
  console.log('Posibles tecnologías (ordenadas por plausibilidad):');
  if (report.results.length) {
    report.results.forEach(r =>
      console.log(`  - ${r.tech} (confianza aprox ${Math.round(r.confidence * 100)}%)`)
    );
  } else {
    console.log('  (sin resultados concluyentes)');
  }
  console.log('Score global heurístico:', report.confidence_score + '/100');
  console.log('--- Evidencias detalladas (JSON) ---');
  console.log(JSON.stringify(report, null, 2));

  // Exit code útil para CI
  const top = report.results?.[0];
  process.exit(top && top.confidence >= 0.6 ? 0 : 1);
})().catch(err => {
  console.error('Fallo inesperado:', err && (err.stack || err.message || String(err)));
  process.exit(2);
});
