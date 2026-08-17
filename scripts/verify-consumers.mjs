import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const packageDirectory = resolve(import.meta.dirname, "..");
const verifier = join(import.meta.dirname, "verify-consumer.mjs");
const nextVerifier = join(import.meta.dirname, "verify-next-consumer.mjs");
const temporaryDirectory = await mkdtemp(join(tmpdir(), "mintform-consumers-"));
const packageOutputDirectory = join(temporaryDirectory, "package");
const cacheDirectory = join(temporaryDirectory, "npm-cache");
const managers = ["npm", "pnpm", "yarn", "bun"];
const reactMajors = ["18", "19"];

async function sha512(path) {
  return createHash("sha512")
    .update(await readFile(path))
    .digest("hex");
}

try {
  await mkdir(packageOutputDirectory, { recursive: true });

  const packedOutput = execFileSync(
    "npm",
    [
      "pack",
      "--json",
      "--ignore-scripts",
      "--pack-destination",
      packageOutputDirectory,
      "--cache",
      cacheDirectory,
    ],
    { cwd: packageDirectory, encoding: "utf8" },
  );
  const [packed] = JSON.parse(packedOutput);
  const tarball = join(packageOutputDirectory, packed.filename);
  const originalDigest = await sha512(tarball);

  assert.equal(packed.name, "@rickybharti/mintform");

  for (const manager of managers) {
    for (const reactMajor of reactMajors) {
      execFileSync(process.execPath, [verifier, manager, reactMajor, tarball], {
        cwd: packageDirectory,
        env: {
          ...process.env,
          COREPACK_ENABLE_DOWNLOAD_PROMPT: "0",
        },
        stdio: "inherit",
      });
      assert.equal(
        await sha512(tarball),
        originalDigest,
        `${manager} must not mutate the shared package tarball.`,
      );
    }
  }

  execFileSync(process.execPath, [nextVerifier, tarball], {
    cwd: packageDirectory,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: "inherit",
  });
  assert.equal(
    await sha512(tarball),
    originalDigest,
    "The Next.js consumer must not mutate the shared package tarball.",
  );

  console.log(
    `Verified one immutable ${packed.name}@${packed.version} tarball across npm, pnpm, Yarn PnP, and Bun with React 18 and 19, plus Next.js App and Pages Routers.`,
  );
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
