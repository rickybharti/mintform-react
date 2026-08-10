import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const packageDirectory = resolve(import.meta.dirname, "..");
const cacheDirectory = await mkdtemp(join(tmpdir(), "mintform-npm-cache-"));

try {
  const manifest = JSON.parse(
    await readFile(join(packageDirectory, "package.json"), "utf8"),
  );
  const output = execFileSync(
    "npm",
    [
      "pack",
      "--dry-run",
      "--json",
      "--ignore-scripts",
      "--cache",
      cacheDirectory,
    ],
    { cwd: packageDirectory, encoding: "utf8" },
  );
  const packed = JSON.parse(output)[0];
  const packedFiles = new Set(packed.files.map((file) => file.path));

  assert.equal(
    manifest.private,
    true,
    "The pre-publish safety guard must stay on.",
  );
  assert.equal(manifest.name, "@rickybharti/mintform");
  assert.equal(manifest.exports["."].import, "./dist/index.js");
  assert.equal(manifest.exports["."].require, "./dist/index.cjs");
  assert.equal(manifest.exports["./styles.css"], "./dist/mintform.css");

  for (const requiredFile of [
    "dist/index.js",
    "dist/index.cjs",
    "dist/index.d.ts",
    "dist/mintform.css",
    "package.json",
    "README.md",
  ]) {
    assert(
      packedFiles.has(requiredFile),
      `Missing packed file: ${requiredFile}`,
    );
  }

  const expectedDistFiles = new Set([
    "dist/index.js",
    "dist/index.cjs",
    "dist/index.d.ts",
    "dist/index.d.ts.map",
    "dist/Mintform.d.ts",
    "dist/Mintform.d.ts.map",
    "dist/core/geometry.d.ts",
    "dist/core/geometry.d.ts.map",
    "dist/mintform.css",
  ]);

  for (const leakedPath of packedFiles) {
    assert(
      !leakedPath.startsWith("src/"),
      `Source leaked into package: ${leakedPath}`,
    );
    assert.notEqual(
      leakedPath,
      "index.html",
      "Demo entry point leaked into package.",
    );
    assert(
      !leakedPath.startsWith("tests/"),
      `Test leaked into package: ${leakedPath}`,
    );
    assert(
      !leakedPath.startsWith("dist/") || expectedDistFiles.has(leakedPath),
      `Unexpected distributable artifact: ${leakedPath}`,
    );
  }

  console.log(
    `Verified ${packed.name}@${packed.version} (${packed.files.length} packed files).`,
  );
} finally {
  await rm(cacheDirectory, { recursive: true, force: true });
}
