import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";

const temporaryDirectory = await mkdtemp(join(tmpdir(), "mintform-next-"));
const consumerDirectory = join(temporaryDirectory, "consumer");
const cacheDirectory = join(temporaryDirectory, "npm-cache");
const tarball = process.argv[2] ? resolve(process.argv[2]) : undefined;

if (!tarball) {
  throw new Error("Usage: node scripts/verify-next-consumer.mjs <package.tgz>");
}

function run(command, arguments_) {
  try {
    execFileSync(command, arguments_, {
      cwd: consumerDirectory,
      encoding: "utf8",
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
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

async function filesBelow(directory) {
  const files = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await filesBelow(path)));
    } else {
      files.push(path);
    }
  }

  return files;
}

try {
  await mkdir(join(consumerDirectory, "app"), { recursive: true });
  await mkdir(join(consumerDirectory, "pages"), { recursive: true });

  await writeFile(
    join(consumerDirectory, "package.json"),
    `${JSON.stringify(
      {
        name: "mintform-next-consumer-smoke",
        private: true,
        scripts: { build: "next build" },
        dependencies: {
          "@rickybharti/mintform": `file:${tarball}`,
          next: "16.2.12",
          react: "19.2.8",
          "react-dom": "19.2.8",
          typescript: "5.9.3",
          "@types/node": "^24.0.0",
          "@types/react": "19.2.18",
          "@types/react-dom": "19.2.4",
        },
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    join(consumerDirectory, "next.config.mjs"),
    [
      "/** @type {import('next').NextConfig} */",
      "const nextConfig = {",
      '  output: "export",',
      "  reactStrictMode: true,",
      "};",
      "",
      "export default nextConfig;",
      "",
    ].join("\n"),
  );
  await writeFile(
    join(consumerDirectory, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: false,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          plugins: [{ name: "next" }],
        },
        include: [
          "next-env.d.ts",
          "**/*.ts",
          "**/*.tsx",
          ".next/types/**/*.ts",
        ],
        exclude: ["node_modules"],
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    join(consumerDirectory, "next-env.d.ts"),
    [
      '/// <reference types="next" />',
      '/// <reference types="next/image-types/global" />',
      "",
    ].join("\n"),
  );
  await writeFile(
    join(consumerDirectory, "app/layout.tsx"),
    [
      'import "@rickybharti/mintform/styles.css";',
      'import type { ReactNode } from "react";',
      "",
      "export default function RootLayout({ children }: { children: ReactNode }) {",
      "  return (",
      '    <html lang="en">',
      "      <body>{children}</body>",
      "    </html>",
      "  );",
      "}",
      "",
    ].join("\n"),
  );
  await writeFile(
    join(consumerDirectory, "app/custom-mark-token.tsx"),
    [
      '"use client";',
      "",
      'import { Mintform } from "@rickybharti/mintform";',
      "",
      "export function CustomMarkToken() {",
      "  return (",
      "    <Mintform",
      '      appearance="clean"',
      "      interactive={false}",
      '      material={{ color: "#627eea" }}',
      '      motion={{ idle: "none" }}',
      "      mark={{",
      '        kind: "custom",',
      "        render: ({ id, side }) => (",
      '          <svg viewBox="0 0 160 160" aria-hidden="true" data-next-custom-mark={side}>',
      '            <path id={id + "-diamond"} d="M80 24 124 80 80 136 36 80Z" fill="currentColor" />',
      "          </svg>",
      "        ),",
      "      }}",
      "    />",
      "  );",
      "}",
      "",
    ].join("\n"),
  );
  await writeFile(
    join(consumerDirectory, "app/page.tsx"),
    [
      'import { Mintform, type MintformProps } from "@rickybharti/mintform";',
      'import { CustomMarkToken } from "./custom-mark-token";',
      "",
      "const serverConfiguredProps = {",
      '  preset: "sgho",',
      '  appearance: "sculpted",',
      "  size: 160,",
      "  thickness: 16,",
      '  material: { color: "#31df4d" },',
      '  lowerField: { color: "#9184ff", reach: 0.52, softness: 0.3 },',
      '  motion: { idle: "none", profile: "reference" },',
      '  ariaLabel: "Spin the server-configured Mintform token",',
      "} satisfies MintformProps;",
      "",
      "export default function Page() {",
      "  return (",
      "    <main>",
      "      <h1>Mintform Next.js consumer</h1>",
      "      <Mintform {...serverConfiguredProps} />",
      "      <CustomMarkToken />",
      "    </main>",
      "  );",
      "}",
      "",
    ].join("\n"),
  );
  await writeFile(
    join(consumerDirectory, "pages/_app.tsx"),
    [
      'import "@rickybharti/mintform/styles.css";',
      'import type { AppProps } from "next/app";',
      "",
      "export default function App({ Component, pageProps }: AppProps) {",
      "  return <Component {...pageProps} />;",
      "}",
      "",
    ].join("\n"),
  );
  await writeFile(
    join(consumerDirectory, "pages/pages-router.tsx"),
    [
      'import { Mintform, type MintformProps } from "@rickybharti/mintform";',
      "",
      "const pagesRouterProps = {",
      '  preset: "gho",',
      '  appearance: "clean",',
      "  interactive: false,",
      '  motion: { idle: "none" },',
      "} satisfies MintformProps;",
      "",
      "export default function PagesRouterPage() {",
      "  return <Mintform {...pagesRouterProps} />;",
      "}",
      "",
    ].join("\n"),
  );

  run("npm", [
    "install",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--cache",
    cacheDirectory,
  ]);
  run("npm", ["run", "build"]);

  const exportedHtmlPath = join(consumerDirectory, "out/index.html");
  assert.equal(
    existsSync(exportedHtmlPath),
    true,
    "Next.js must statically render the App Router page.",
  );

  const exportedHtml = await readFile(exportedHtmlPath, "utf8");
  assert.match(
    exportedHtml,
    /data-mintform-preset="sgho"/,
    "The Server Component must prerender the directly imported Mintform client boundary.",
  );
  assert.match(
    exportedHtml,
    /data-next-custom-mark="front"/,
    "The explicit Client Component must prerender its custom SVG mark.",
  );

  const pagesRouterHtmlPath = join(consumerDirectory, "out/pages-router.html");
  assert.equal(
    existsSync(pagesRouterHtmlPath),
    true,
    "Next.js must statically render the typed Pages Router fixture.",
  );
  assert.match(
    await readFile(pagesRouterHtmlPath, "utf8"),
    /data-mintform-preset="gho"/,
    "The Pages Router must prerender Mintform from the packed package.",
  );

  const outputFiles = await filesBelow(
    join(consumerDirectory, "out/_next/static"),
  );
  const cssFiles = outputFiles.filter((file) => extname(file) === ".css");
  const javascriptFiles = outputFiles.filter((file) => extname(file) === ".js");
  assert(
    cssFiles.length > 0,
    "Next.js must emit the external Mintform stylesheet.",
  );
  assert(
    javascriptFiles.length > 0,
    "Next.js must emit a client bundle for Mintform hydration.",
  );

  const emittedCss = (
    await Promise.all(cssFiles.map((file) => readFile(file, "utf8")))
  ).join("\n");
  assert.match(
    emittedCss,
    /\.mintform\b/,
    "The emitted Next.js CSS must contain Mintform's component styles.",
  );

  console.log(
    "Verified the packed package in a typed Next.js production build across the App and Pages Routers, including server prerendering, a client boundary, custom SVG content, and external CSS.",
  );
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
