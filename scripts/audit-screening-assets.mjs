import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve, relative } from "node:path";

// Verify the actual Eleventy-selected runtime, including relative module imports.
// This checks routing and byte identity; it is not a browser or mobile test.
const site = resolve(process.argv[2] || "_site");
const source = resolve("src");
const prefix = "/doctrine-site-box";
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const closure = new Map();

function localAsset(url, parent = site) {
  assert.ok(!/^(?:[a-z]+:|\/\/)/i.test(url), `Nonlocal runtime dependency: ${url}`);
  const clean = url.split(/[?#]/, 1)[0];
  if (clean.startsWith("/")) {
    assert.ok(clean.startsWith(`${prefix}/`), `Missing Pages basepath: ${url}`);
    return resolve(site, `.${clean.slice(prefix.length)}`);
  }
  const file = resolve(parent, clean);
  assert.ok(!relative(site, file).startsWith(".."), `Runtime dependency escapes site: ${url}`);
  return file;
}

async function visit(file) {
  if (closure.has(file)) return;
  const bytes = await readFile(file);
  const path = relative(site, file).replaceAll("\\", "/");
  assert.ok(path.startsWith("assets/screening/"), `Unexpected screening dependency: ${path}`);
  const original = await readFile(resolve(source, path));
  assert.equal(sha256(bytes), sha256(original), `Built/source byte mismatch: ${path}`);
  closure.set(file, { path, bytes: bytes.length, sha256: sha256(bytes) });
  const text = bytes.toString("utf8");
  if (file.endsWith(".js")) {
    const imports = [
      ...text.matchAll(/^\s*import\s+(?:[^;]+?\s+from\s*)?["']([^"']+)["']/gm),
      ...text.matchAll(/\bimport\s*\(\s*["']([^"']+)["']/g)
    ];
    for (const [, dependency] of imports) await visit(localAsset(dependency, dirname(file)));
    // New worker/parser mechanisms must be made explicit in this audit.
    assert.ok(!/new\s+(?:Shared)?Worker\s*\(|importScripts\s*\(/.test(text), `Unreviewed worker: ${path}`);
  }
  if (file.endsWith(".css")) {
    assert.ok(!/@import\b|url\s*\(/i.test(text), `Unreviewed CSS dependency: ${path}`);
  }
}

let selected;
for (const language of ["en", "ua"]) {
  const html = await readFile(resolve(site, language, "screening/index.html"), "utf8");
  assert.ok(html.includes(`data-language="${language}"`), `Wrong language mount: ${language}`);
  const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)]
    .map(match => match[1]).filter(url => url.includes("/assets/screening/"));
  const styles = [...html.matchAll(/<link\b[^>]*href="([^"]+)"/g)]
    .map(match => match[1]).filter(url => url.includes("/assets/screening/"));
  assert.equal(scripts.length, 1, `Expected one screening entry: ${language}`);
  assert.equal(styles.length, 1, `Expected one screening stylesheet: ${language}`);
  const version = scripts[0].match(/\/screening-(v\d+)\.js$/)?.[1];
  assert.ok(version, `Generic or unversioned screening entry: ${scripts[0]}`);
  assert.ok(styles[0].endsWith(`/screening-${version}.css`), `Entry/CSS mismatch: ${language}`);
  assert.equal(selected || version, version, "EN/UA runtime differs");
  selected = version;
  for (const url of [...scripts, ...styles]) await visit(localAsset(url));
}
console.log(JSON.stringify({ status: "PASS", selected, prefix, assets: [...closure.values()] }, null, 2));
