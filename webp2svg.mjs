#!/usr/bin/env node
// webp2svg.mjs — versión robusta para logos blancos con transparencia

import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import potrace from "potrace";
const { Potrace, Posterize } = potrace;

const argv = yargs(hideBin(process.argv))
  .usage("node $0 input.webp out.svg [opciones]")
  .option("mode",        { type: "string", default: "threshold", choices: ["threshold","posterize"] })
  .option("preThreshold",{ type: "number", default: 180, desc: "Umbral previo (Sharp) 0..255" })
  .option("threshold",   { type: "number", default: 128,  desc: "Umbral interno Potrace 0..255" })
  .option("invert",      { type: "boolean", default: false })
  .option("turdSize",    { type: "number", default: 2 })
  .option("optTolerance",{ type: "number", default: 0.2 })
  .option("turnPolicy",  { type: "string", default: "minority", choices: ["minority","majority","black","white","left","right"] })
  .option("color",       { type: "string", default: "#ffffff", desc: "Color de relleno del SVG" })
  .option("background",  { type: "string", default: "auto", desc: "auto | transparent | #000000 | #FFFFFF ..." })
  .option("steps",       { type: "number", default: 4 })
  .option("scale",       { type: "number", default: 1 })
  .option("blur",        { type: "number", default: 0 })
  .option("debug",       { type: "boolean", default: false })
  .demandCommand(2)
  .help()
  .argv;

const [inputPath, outPath] = argv._;

async function ensureDirFor(filePath){
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

function parseHex(bg) {
  let hex = bg.trim().toLowerCase();
  if (hex.startsWith("#")) hex = hex.slice(1);
  if (hex.length === 3) hex = hex.split("").map(ch => ch+ch).join("");
  const r = parseInt(hex.slice(0,2), 16) || 0;
  const g = parseInt(hex.slice(2,4), 16) || 0;
  const b = parseInt(hex.slice(4,6), 16) || 0;
  return { r, g, b, alpha: 1 };
}

/**
 * Preprocesado agresivo:
 *  - Aplana transparencia sobre fondo NEGRO (por defecto), o el que pases
 *  - Quita alfa, pasa a escala de grises y aplica threshold binario
 *  - Opcional: reescala y desenfoca suave para reducir ruido
 */
async function makeBinarizedPNG(input, {
  scale=1, blur=0, preThreshold=180, background="auto"
}){
  let img = sharp(input, { limitInputPixels: false });
  const meta = await img.metadata();

  // Elegir fondo:
  // auto => negro, que es lo que mejor funciona para "blanco sobre transparente"
  let bg = background === "auto"
    ? { r: 0, g: 0, b: 0, alpha: 1 }
    : (background === "transparent" ? { r:0,g:0,b:0,alpha:0 } : parseHex(background));

  // 1) Aplanar sobre fondo elegido
  img = img.flatten({ background: bg });

  // 2) Escala opcional (ayuda a potrace en iconos pequeños)
  if (scale && scale !== 1) {
    const nw = Math.max(1, Math.round((meta.width  || 0) * scale));
    const nh = Math.max(1, Math.round((meta.height || 0) * scale));
    if (nw > 1 && nh > 1) img = img.resize(nw, nh, { kernel: sharp.kernel.lanczos3 });
  }

  // 3) Blur opcional
  if (blur && blur > 0) img = img.blur(blur);

  // 4) Quitar alfa, gris y umbral binario
  img = img
    .removeAlpha()
    .grayscale()
    .threshold(preThreshold); // ← binarizamos aquí

  const buf = await img.png({ compressionLevel: 9 }).toBuffer();

  if (argv.debug) {
    await fs.writeFile(outPath.replace(/\.svg$/i, ".debug.png"), buf);
    console.log("🧪 guardado preprocesado:", outPath.replace(/\.svg$/i, ".debug.png"));
  }
  return buf;
}

async function traceThreshold(buffer, {
  threshold=128, invert=false, turdSize=2, optTolerance=0.2, turnPolicy="minority", color="#ffffff"
}) {
  return new Promise((resolve, reject) => {
    const tracer = new Potrace({
      // Como ya binarizamos antes, este threshold casi no influye, pero lo dejamos.
      threshold,
      invert,
      turdSize,
      optCurve: true,
      optTolerance,
      turnPolicy,
      color,              // fill del path final
      background: "transparent"
    });
    tracer.loadImage(buffer, (err) => {
      if (err) return reject(err);
      try { resolve(tracer.getSVG()); } catch (e) { reject(e); }
    });
  });
}

async function tracePosterize(buffer, {
  steps=4, turdSize=2, optTolerance=0.2, turnPolicy="minority"
}) {
  return new Promise((resolve, reject) => {
    const tracer = new Posterize({
      steps: Math.max(2, steps),
      turdSize,
      optCurve: true,
      optTolerance,
      turnPolicy,
      background: "transparent"
    });
    tracer.loadImage(buffer, (err) => {
      if (err) return reject(err);
      try { resolve(tracer.getSVG()); } catch (e) { reject(e); }
    });
  });
}

(async () => {
  try {
    const bin = await makeBinarizedPNG(inputPath, {
      scale: argv.scale,
      blur: argv.blur,
      preThreshold: argv.preThreshold,
      background: argv.background
    });

    const svg = (argv.mode === "posterize")
      ? await tracePosterize(bin, {
          steps: argv.steps,
          turdSize: argv.turdSize,
          optTolerance: argv.optTolerance,
          turnPolicy: argv.turnPolicy
        })
      : await traceThreshold(bin, {
          threshold: argv.threshold,
          invert: argv.invert,
          turdSize: argv.turdSize,
          optTolerance: argv.optTolerance,
          turnPolicy: argv.turnPolicy,
          color: argv.color
        });

    await ensureDirFor(outPath);
    await fs.writeFile(outPath, svg, "utf8");
    console.log(`✅ SVG generado: ${outPath}`);
  } catch (err) {
    console.error("❌ Error:", err?.message || err);
    process.exit(1);
  }
})();
