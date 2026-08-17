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
    false,
    "The reviewed package must be explicitly publishable.",
  );
  assert.equal(manifest.name, "@rickybharti/mintform");
  assert.equal(manifest.publishConfig.access, "public");
  assert.equal(
    manifest.publishConfig.tag,
    manifest.version.includes("-") ? "next" : undefined,
    "Prereleases must use the next tag; stable releases must use npm's default latest tag.",
  );
  assert.equal(manifest.exports["."].import.types, "./dist/index.d.ts");
  assert.equal(manifest.exports["."].import.default, "./dist/index.js");
  assert.equal(manifest.exports["."].require.types, "./dist/index.d.cts");
  assert.equal(manifest.exports["."].require.default, "./dist/index.cjs");
  assert.equal(
    manifest.exports["./styles.css"].import.types,
    "./dist/mintform.css.d.ts",
  );
  assert.equal(
    manifest.exports["./styles.css"].import.default,
    "./dist/mintform.css",
  );
  assert.equal(
    manifest.exports["./styles.css"].require.types,
    "./dist/mintform.css.d.cts",
  );
  assert.equal(
    manifest.exports["./styles.css"].require.default,
    "./dist/mintform.css",
  );

  for (const requiredFile of [
    "dist/index.js",
    "dist/index.cjs",
    "dist/index.d.ts",
    "dist/index.d.cts",
    "dist/mintform.css",
    "dist/mintform.css.d.ts",
    "dist/mintform.css.d.cts",
    "package.json",
    "README.md",
    "API.md",
    "STACK.md",
    "TESTING.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "PUBLISHING-CHECKLIST.md",
    "CHANGELOG.md",
    "LICENSE",
    "NOTICE",
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
    "dist/index.d.cts",
    "dist/mintform.css",
    "dist/mintform.css.d.ts",
    "dist/mintform.css.d.cts",
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
