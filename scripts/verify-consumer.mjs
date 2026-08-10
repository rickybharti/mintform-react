import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const packageDirectory = resolve(import.meta.dirname, "..");
const temporaryDirectory = await mkdtemp(join(tmpdir(), "mintform-consumer-"));
const packageOutputDirectory = join(temporaryDirectory, "package");
const consumerDirectory = join(temporaryDirectory, "consumer");
const cacheDirectory = join(temporaryDirectory, "npm-cache");

function runNpm(arguments_, cwd) {
  execFileSync("npm", arguments_, {
    cwd,
    encoding: "utf8",
    stdio: "pipe",
  });
}

try {
  await Promise.all([
    mkdir(packageOutputDirectory, { recursive: true }),
    mkdir(join(consumerDirectory, "src"), { recursive: true }),
  ]);

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
  const packed = JSON.parse(packedOutput)[0];
  const tarball = join(packageOutputDirectory, packed.filename);

  await writeFile(
    join(consumerDirectory, "package.json"),
    `${JSON.stringify(
      {
        name: "mintform-packed-consumer-smoke",
        private: true,
        type: "module",
        scripts: { build: "tsc --noEmit && vite build" },
        dependencies: {
          "@rickybharti/mintform": `file:${tarball}`,
          react: "19.2.8",
          "react-dom": "19.2.8",
          vite: "7.3.6",
          typescript: "5.9.3",
          "@types/react": "19.2.18",
          "@types/react-dom": "19.2.4",
        },
      },
      null,
      2,
    )}\n`,
  );
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
          module: "ESNext",
          moduleResolution: "Bundler",
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
      '  ariaLabel: "Packed Mintform consumer smoke test",',
      '  material: { color: "#4dd93d" },',
      '  lowerField: { color: "#978eff", reach: 0.5 },',
      "  interactive: false,",
      '  motion: { spinOnPress: false, idle: "none" },',
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
    join(consumerDirectory, "smoke.cjs"),
    [
      'const assert = require("node:assert/strict");',
      'const { Mintform } = require("@rickybharti/mintform");',
      "",
      'assert.ok(Mintform, "The CommonJS Mintform export should load.");',
      "",
    ].join("\n"),
  );

  runNpm(
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--cache",
      cacheDirectory,
    ],
    consumerDirectory,
  );
  runNpm(["run", "build"], consumerDirectory);
  execFileSync(process.execPath, ["smoke.cjs"], {
    cwd: consumerDirectory,
    encoding: "utf8",
  });

  assert.equal(packed.name, "@rickybharti/mintform");
  console.log(
    `Verified packed consumer build for ${packed.name}@${packed.version}.`,
  );
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
