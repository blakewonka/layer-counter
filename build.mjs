// Build script for the Layer Counter plugin.
//
//   node build.mjs          one-off production build
//   node build.mjs --watch  rebuild on every change (unminified)
//
// Produces exactly two files, as referenced by manifest.json:
//   dist/code.js   the plugin controller (runs in Figma's sandbox)
//   dist/ui.html   the UI, with its CSS and JS inlined (Figma loads it as one string)

import * as esbuild from "esbuild";
import {
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { extname, join } from "node:path";

const watch = process.argv.includes("--watch");
const dist = "dist";
const templatePath = join("src", "ui", "index.html");

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

// ── Build A: plugin controller ─────────────────────────────────────────────
const pluginOptions = {
  entryPoints: [join("src", "plugin", "main.ts")],
  outfile: join(dist, "code.js"),
  bundle: true,
  format: "iife",
  // Syntax level for Figma's plugin sandbox: esbuild downlevels `??`, `?.`
  // and friends; async/await stays. Library calls are checked against ES2020
  // by tsconfig.
  target: "es2017",
  minify: !watch,
  sourcemap: false,
};

// ── Build B: UI (JS + CSS kept in memory, then inlined into ui.html) ───────
const uiOptions = {
  entryPoints: [join("src", "ui", "main.ts")],
  outdir: dist, // required for multiple outputs; nothing is written (write: false)
  write: false,
  bundle: true,
  format: "iife",
  target: "es2020", // the plugin window is a current Chromium
  minify: !watch,
  sourcemap: false,
  plugins: [
    {
      name: "write-ui-html",
      setup(build) {
        build.onEnd((result) => {
          if (result.errors.length > 0) return;
          writeUiHtml(result.outputFiles);
          if (watch) logBuilt();
        });
      },
    },
  ],
};

function writeUiHtml(outputFiles) {
  let js = "";
  let css = "";
  for (const file of outputFiles) {
    const ext = extname(file.path);
    if (ext === ".js") js += file.text;
    else if (ext === ".css") css += file.text;
    else throw new Error(`Unexpected UI build output: ${file.path}`);
  }
  if (!js) throw new Error("UI build produced no JavaScript output");

  // A literal "</script" or "</style" inside the inlined code would end the
  // HTML element early. Inside JS strings "<\/" is still "</"; inside CSS
  // "\/" is still "/".
  js = js.replace(/<\/(script)/gi, "<\\/$1");
  css = css.replace(/<\/(style)/gi, "<\\/$1");

  // The template is shipped verbatim, so its formatting whitespace is
  // collapsed first: newlines (with their indentation) become one space, and
  // whitespace between tags is dropped. Every container in it is a flex or
  // block box, so whitespace-only text nodes never render.
  let html = readFileSync(templatePath, "utf8")
    .replace(/\s*\n\s*/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/\s+>/g, ">");
  html = insertBefore(html, "</head>", `<style>${css}</style>`);
  html = insertBefore(html, "</body>", `<script>${js}</script>`);
  writeFileSync(join(dist, "ui.html"), html);
}

// Inserts `element` just before `closingTag`. String slicing (rather than
// String.prototype.replace) keeps the code verbatim: a replacement string
// would expand "$&", "$'" and friends that occur inside minified JS.
function insertBefore(html, closingTag, element) {
  const index = html.indexOf(closingTag);
  if (index === -1)
    throw new Error(`${templatePath} must contain ${closingTag}`);
  return `${html.slice(0, index)}${element}${html.slice(index)}`;
}

function logBuilt() {
  const sizes = [];
  for (const name of ["code.js", "ui.html"]) {
    const path = join(dist, name);
    let bytes;
    try {
      bytes = statSync(path).size;
    } catch {
      continue; // not built yet (watch mode: the other context may still be running)
    }
    sizes.push(`${path} ${bytes.toLocaleString("en-US")} B`);
  }
  console.log(`built ${sizes.join(", ")}`);
}

if (watch) {
  const pluginContext = await esbuild.context({
    ...pluginOptions,
    plugins: [
      {
        name: "log-plugin-build",
        setup(build) {
          build.onEnd((result) => {
            if (result.errors.length === 0) logBuilt();
          });
        },
      },
    ],
  });
  const uiContext = await esbuild.context(uiOptions);
  await Promise.all([pluginContext.watch(), uiContext.watch()]);
  console.log("watching for changes...");
} else {
  await esbuild.build(pluginOptions);
  await esbuild.build(uiOptions);
  logBuilt();
}
