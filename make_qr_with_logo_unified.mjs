#!/usr/bin/env node
// make_qr_with_logo_unified.mjs
// Uso:
//  node make_qr_with_logo_unified.mjs "https://www.dirtyrootsberlin.com/infographics" ./logo.svg ./qr.svg --size=1024 --logoScale=0.22 --fg=000000 --bg=FFFFFF --badge
//  node make_qr_with_logo_unified.mjs "https://www.dirtyrootsberlin.com/infographics" ./logo.svg ./qr.png --size=1200 --logoScale=0.18 --fg=000000 --bg=FFFFFF --badge
//
// * La variante se decide por la extensión de salida:
//   - .svg  => salida vectorial SVG
//   - .png/.webp/.jpg/.jpeg => salida raster con sharp (PNG/WEBP/JPG)
// * Dependencias: `qrcode`. Para raster, también `sharp`.
//
//  npm i qrcode
//  # si usarás raster:
//  npm i sharp

import fs from "fs/promises";
import path from "path";
import QRCode from "qrcode";

function parseArgs() {
  const [,, url, svgPath, outPath, ...rest] = process.argv;
  if (!url || !svgPath || !outPath) {
    console.error(
      "Uso: node make_qr_with_logo_unified.mjs <url> <ruta_logo_svg> <salida.(svg|png|webp|jpg)> [--size=1024] [--logoScale=0.22] [--fg=000000] [--bg=FFFFFF] [--badge]"
    );
    process.exit(1);
  }
  const opts = { size: 1024, logoScale: 0.22, fg: "000000", bg: "FFFFFF", badge: false };
  for (const arg of rest) {
    if (arg.startsWith("--size=")) opts.size = Math.max(256, parseInt(arg.split("=")[1], 10));
    else if (arg.startsWith("--logoScale=")) opts.logoScale = Math.min(0.4, Math.max(0.05, parseFloat(arg.split("=")[1])));
    else if (arg.startsWith("--fg=")) opts.fg = arg.split("=")[1].replace("#", "");
    else if (arg.startsWith("--bg=")) opts.bg = arg.split("=")[1].replace("#", "");
    else if (arg === "--badge") opts.badge = true;
  }
  return { url, svgPath, outPath, opts };
}

function b64(svgString) {
  return Buffer.from(svgString, "utf8").toString("base64");
}

function extOf(p) {
  return path.extname(p).toLowerCase();
}

async function makeSVG({ url, svgPath, outPath, size, logoScale, fg, bg, badge }) {
  const qrSvg = await QRCode.toString(url, {
    errorCorrectionLevel: "H",
    type: "svg",
    margin: 2,
    color: { dark: `#${fg}`, light: `#${bg}` },
    width: size
  });


  const logoSvgString = await fs.readFile(path.resolve(svgPath), "utf8");
  const logoSize = Math.round(size * logoScale);
  const center = size / 2;
  const half = logoSize / 2;

  const pad = Math.round(logoSize * 0.18);
  const badgeSize = logoSize + pad * 2;
  const badgeHalf = badgeSize / 2;
  const badgeRadius = Math.round(badgeSize * 0.18);

  const badgeRect = badge
    ? `<rect x="${center - badgeHalf}" y="${center - badgeHalf}" width="${badgeSize}" height="${badgeSize}" rx="${badgeRadius}" ry="${badgeRadius}" fill="#FFFFFF"/>`
    : "";

  const finalSvg =
`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs/>
  <!-- QR ocupa todo el lienzo: -->
  <image x="0" y="0" width="${size}" height="${size}"
         href="data:image/svg+xml;base64,${Buffer.from(qrSvg, "utf8").toString("base64")}" />
  ${badgeRect}
  <!-- Logo centrado encima: -->
  <image x="${center - half}" y="${center - half}" width="${logoSize}" height="${logoSize}"
         href="data:image/svg+xml;base64,${Buffer.from(logoSvgString, "utf8").toString("base64")}" />
</svg>`;

  await fs.writeFile(outPath, finalSvg, "utf8");
}

async function makeRaster({ url, svgPath, outPath, size, logoScale, fg, bg, badge }) {
  // import dinámico para no exigir 'sharp' si solo usas SVG
  const { default: sharp } = await import("sharp");

  // 1) QR base (PNG buffer) y escalar al tamaño final exacto
  const qrBuf = await QRCode.toBuffer(url, {
    errorCorrectionLevel: "H",
    type: "png",
    margin: 2,
    color: { dark: `#${fg}`, light: `#${bg}` },
  });
  const qrSized = await sharp(qrBuf).resize(size, size, { fit: "contain" }).png().toBuffer();

  // 2) Logo (rasterizar SVG y escalar)
  const logoSize = Math.round(size * logoScale);
  const svgData = await fs.readFile(path.resolve(svgPath));
  const logoPng = await sharp(svgData).resize(logoSize, logoSize, { fit: "contain" }).png().toBuffer();

  // 3) Badge opcional (SVG → PNG)
  const composites = [];
  if (badge) {
    const pad = Math.round(logoSize * 0.18);
    const badgeSize = logoSize + pad * 2;
    const badgeRadius = Math.round(badgeSize * 0.18);
    const badgeSvg = Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${badgeSize}" height="${badgeSize}">
        <rect x="0" y="0" width="${badgeSize}" height="${badgeSize}" rx="${badgeRadius}" ry="${badgeRadius}" fill="#FFFFFF"/>
      </svg>
    `);
    const badgePng = await sharp(badgeSvg).png().toBuffer();
    composites.push({ input: badgePng, gravity: "center" });
  }

  // 4) Logo encima
  composites.push({ input: logoPng, gravity: "center" });

  // 5) Componer
  let img = sharp(qrSized).composite(composites);

  // 6) Elegir formato por extensión
  const ext = extOf(outPath);
  if (ext === ".png") img = img.png();
  else if (ext === ".webp") img = img.webp();
  else if (ext === ".jpg" || ext === ".jpeg") {
    // En JPG no hay transparencia; si el bg es claro, queda bien.
    img = img.flatten({ background: `#${bg}` }).jpeg({ quality: 90 });
  } else {
    console.warn(`Extensión ${ext} no reconocida para raster; guardando como PNG.`);
    outPath = outPath.replace(ext, ".png");
    img = img.png();
  }

  await img.toFile(outPath);
}

async function main() {
  const { url, svgPath, outPath, opts } = parseArgs();
  const { size, logoScale, fg, bg, badge } = opts;
  const ext = extOf(outPath);

  if (ext === ".svg") {
    await makeSVG({ url, svgPath, outPath, size, logoScale, fg, bg, badge });
  } else {
    await makeRaster({ url, svgPath, outPath, size, logoScale, fg, bg, badge });
  }

  console.log(`✅ QR generado: ${outPath}
- URL: ${url}
- Tamaño: ${size}${ext === ".svg" ? "" : " px"}
- Logo: ${svgPath} (${Math.round(logoScale * 100)}%)
- Colores: fg #${fg} / bg #${bg}
- Badge: ${badge ? "sí" : "no"}`);
}

main().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
