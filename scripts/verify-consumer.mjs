import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const temporaryDirectory = await mkdtemp(join(tmpdir(), "mintform-consumer-"));
const consumerDirectory = join(temporaryDirectory, "consumer");
const cacheDirectory = join(temporaryDirectory, "npm-cache");
const storeDirectory = join(temporaryDirectory, "pnpm-store");
const manager = process.argv[2];
const reactMajor = process.argv[3];
const tarball = process.argv[4] ? resolve(process.argv[4]) : undefined;
const managers = ["npm", "pnpm", "yarn", "bun"];

if (
  !manager ||
  !managers.includes(manager) ||
  (reactMajor !== "18" && reactMajor !== "19") ||
  !tarball
) {
  throw new Error(
    "Usage: node scripts/verify-consumer.mjs <npm|pnpm|yarn|bun> <18|19> <package.tgz>",
  );
}

const reactVersions =
  reactMajor === "18"
    ? {
        react: "18.2.0",
        reactDom: "18.2.0",
        reactTypes: "18.3.31",
        reactDomTypes: "18.3.7",
      }
    : {
        react: "19.2.8",
        reactDom: "19.2.8",
        reactTypes: "19.2.18",
        reactDomTypes: "19.2.4",
      };

function run(command, arguments_) {
  try {
    execFileSync(command, arguments_, {
      cwd: consumerDirectory,
      encoding: "utf8",
      env: {
        ...process.env,
        COREPACK_ENABLE_DOWNLOAD_PROMPT: "0",
      },
      stdio: "pipe",
    });
  } catch (error) {
    if (error && typeof error === "object") {
      if ("stdout" in error && error.stdout) {
        process.stderr.write(String(error.stdout));
      }
      if ("stderr" in error && error.stderr) {
        process.stderr.write(String(error.stderr));
      }
    }
    throw error;
  }
}

function installAndBuild() {
  switch (manager) {
    case "npm":
      run("npm", [
        "install",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--cache",
        cacheDirectory,
      ]);
      run("npm", ["run", "build"]);
      assert.equal(
        existsSync(join(consumerDirectory, "node_modules")),
        true,
        "The npm fixture must create node_modules.",
      );
      break;
    case "pnpm":
      run("pnpm", [
        "install",
        "--ignore-scripts",
        "--strict-peer-dependencies",
        "--store-dir",
        storeDirectory,
      ]);
      run("pnpm", ["run", "build"]);
      assert.equal(
        existsSync(join(consumerDirectory, "node_modules", ".pnpm")),
        true,
        "The pnpm fixture must use its isolated virtual store.",
      );
      break;
    case "yarn":
      run("corepack", ["yarn", "install"]);
      run("corepack", ["yarn", "run", "build"]);
      assert.equal(
        existsSync(join(consumerDirectory, "node_modules")),
        false,
        "The Yarn fixture must use Plug'n'Play rather than node_modules.",
      );
      assert.equal(
        existsSync(join(consumerDirectory, ".pnp.cjs")),
        true,
        "The Yarn fixture must generate a Plug'n'Play loader.",
      );
      break;
    case "bun":
      run("bun", ["install", "--ignore-scripts", "--linker", "isolated"]);
      run("bun", ["run", "build"]);
      assert.equal(
        existsSync(join(consumerDirectory, "node_modules", ".bun")),
        true,
        "The Bun fixture must use the isolated linker.",
      );
      break;
  }
}

function runNodeSmoke(file) {
  if (manager === "yarn") {
    run("corepack", ["yarn", "node", file]);
    return;
  }
  run(process.execPath, [file]);
}

try {
  await mkdir(join(consumerDirectory, "src"), { recursive: true });

  await writeFile(
    join(consumerDirectory, "package.json"),
    `${JSON.stringify(
      {
        name: "mintform-packed-consumer-smoke",
        private: true,
        type: "module",
        ...(manager === "yarn" ? { packageManager: "yarn@4.18.0" } : {}),
        scripts: { build: "tsc --noEmit && vite build" },
        dependencies: {
          "@rickybharti/mintform": `file:${tarball}`,
          react: reactVersions.react,
          "react-dom": reactVersions.reactDom,
          vite: "7.3.6",
          typescript: "5.9.3",
          "@types/react": reactVersions.reactTypes,
          "@types/react-dom": reactVersions.reactDomTypes,
        },
      },
      null,
      2,
    )}\n`,
  );
  if (manager === "yarn") {
    await writeFile(
      join(consumerDirectory, ".yarnrc.yml"),
      [
        "nodeLinker: pnp",
        "enableGlobalCache: false",
        "enableScripts: false",
        "",
      ].join("\n"),
    );
  }
  await writeFile(
    join(consumerDirectory, "index.html"),
    '<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n',
  );
  await writeFile(
    join(consumerDirectory, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          useDefineForClassFields: true,
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          allowJs: false,
          skipLibCheck: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          module: "NodeNext",
          moduleResolution: "NodeNext",
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: "react-jsx",
          types: ["vite/client"],
        },
        include: ["src"],
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    join(consumerDirectory, "src/main.tsx"),
    [
      'import { createRoot } from "react-dom/client";',
      'import { Mintform, type MintformProps } from "@rickybharti/mintform";',
      'import "@rickybharti/mintform/styles.css";',
      "",
      "const mintformProps = {",
      '  preset: "sgho",',
      '  appearance: "clean",',
      "  size: 160,",
      "  thickness: 16,",
      '  detail: "high",',
      '  ariaLabel: "Packed Mintform consumer smoke test",',
      '  material: { color: "#4dd93d" },',
      '  lowerField: { color: "#978eff", reach: 0.5, softness: 0.3 },',
      '  edge: { accentColor: "#43ad52", accentEvery: 3, finish: "smooth" },',
      '  mark: { kind: "preset", name: "gho", scale: 1, color: "#fff" },',
      "  faces: {",
      "    back: {",
      "      mark: {",
      '        kind: "custom",',
      "        scale: 0.9,",
      "        clipRadius: 62,",
      "        render: ({ id, side }) => (",
      '          <svg viewBox="0 0 160 160" aria-hidden="true">',
      '            <path id={id} data-side={side} d="M40 80h80" stroke="currentColor" strokeWidth="14" />',
      "          </svg>",
      "        ),",
      "      },",
      "    },",
      "  },",
      '  shadow: { intensity: 0.8, color: "#978eff" },',
      '  lighting: "studio",',
      "  interaction: { drag: true },",
      "  orientation: { pitch: 12 },",
      "  motion: {",
      "    initialRotation: 45,",
      "    pitchArc: 12,",
      "    spinOnPress: false,",
      '    direction: "alternate",',
      "    turns: 2,",
      '    idle: "none",',
      '    profile: "brisk",',
      "  },",
      "  interactive: false,",
      "  onSpin: () => undefined,",
      '  rootProps: { id: "mintform-consumer", "data-consumer": "smoke" },',
      '  buttonProps: { disabled: true, title: "Disabled consumer control" },',
      "  rendering: {",
      "    material: {",
      "      tokens: {",
      '        faceBase: "#4dd93d",',
      '        faceMid: "#42ba4a",',
      '        faceShadow: "#2e7d36",',
      '        faceHighlight: "#75f2ab",',
      '        faceDepthHighlight: "#35a757",',
      '        edgeBase: "#4dd93d",',
      '        edgeAccent: "#42ba4a",',
      '        mark: "#fff",',
      "      },",
      "    },",
      "    face: {",
      "      rimInset: 1,",
      "      innerRingInset: 16.5,",
      "      surfaceInset: 18,",
      "      gradients: {",
      '        outer: "linear-gradient(#4dd93d, #2e7d36)",',
      '        rim: "linear-gradient(#75f2ab, #4dd93d)",',
      '        innerRing: "linear-gradient(#2e7d36, #4dd93d)",',
      '        surface: "linear-gradient(#75f2ab, #35a757)",',
      "      },",
      "    },",
      '    edge: { segments: 80, panelWidthRatio: 3.4, baseColor: "#4dd93d" },',
      "    shadow: { bottom: 40, blur: 4, spread: 4 },",
      "    motion: {",
      "      spinDegrees: 360,",
      "      springStiffness: 15,",
      "      springDamping: 8,",
      "      bounceHeight: 20,",
      "      bounceDurationMs: 3000,",
      "      bouncePhaseMs: 0,",
      "    },",
      "  },",
      "} satisfies MintformProps;",
      "",
      'const rootElement = document.querySelector("#root");',
      "",
      "if (!rootElement) {",
      '  throw new Error("Consumer root element is missing.");',
      "}",
      "",
      "createRoot(rootElement).render(",
      "  <Mintform {...mintformProps} />",
      ");",
      "",
    ].join("\n"),
  );
  await writeFile(
    join(consumerDirectory, "src/cjs-types.cts"),
    [
      'import MintformPackage = require("@rickybharti/mintform");',
      "",
      "const component: typeof MintformPackage.Mintform = MintformPackage.Mintform;",
      "const props = {",
      '  preset: "gho",',
      '  appearance: "sculpted",',
      '  motion: { idle: "none" },',
      "} satisfies MintformPackage.MintformProps;",
      "",
      "void [component, props];",
      "",
    ].join("\n"),
  );
  await writeFile(
    join(consumerDirectory, "smoke.cjs"),
    [
      'const assert = require("node:assert/strict");',
      'const { Mintform } = require("@rickybharti/mintform");',
      "",
      'assert.ok(Mintform, "The CommonJS Mintform export should load.");',
      "",
    ].join("\n"),
  );
  await writeFile(
    join(consumerDirectory, "smoke.mjs"),
    [
      'import assert from "node:assert/strict";',
      'import { Mintform } from "@rickybharti/mintform";',
      "",
      'assert.ok(Mintform, "The ESM Mintform export should load.");',
      "",
    ].join("\n"),
  );

  installAndBuild();
  runNodeSmoke("smoke.cjs");
  runNodeSmoke("smoke.mjs");

  console.log(
    `Verified ${manager}${manager === "yarn" ? " PnP" : ""} consumer with React ${reactMajor}.`,
  );
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
