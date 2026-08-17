import { execFileSync } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const packageDirectory = resolve(import.meta.dirname, "..");
const distDirectory = join(packageDirectory, "dist");
const sourceDeclarationPath = join(distDirectory, "Mintform.d.ts");
const esmDeclarationPath = join(distDirectory, "index.d.ts");
const cjsDeclarationPath = join(distDirectory, "index.d.cts");
const esmStyleDeclarationPath = join(distDirectory, "mintform.css.d.ts");
const cjsStyleDeclarationPath = join(distDirectory, "mintform.css.d.cts");
const styleDeclaration =
  "/** Side-effect-only type marker for the CSS export. */\nexport {};\n";

function removeStyleImports(declaration) {
  return declaration
    .replace(/^import "\.\/MintformBase\.css";\r?\n/m, "")
    .replace(/^import "\.\/Mintform\.css";\r?\n/m, "");
}

function removePrivateExports(declaration) {
  const publicDeclaration = declaration
    .replace(/export \{};\r?\n?/, "")
    .replace(/\/\/# sourceMappingURL=.*\r?\n?/, "");

  if (/from "\.\//.test(publicDeclaration)) {
    throw new Error(
      "Published declarations must not reference unbundled local type files.",
    );
  }

  if (/^export declare (?!const Mintform\b)/m.test(publicDeclaration)) {
    throw new Error(
      "A value export changed; update the declaration bundling guard deliberately.",
    );
  }

  if (!publicDeclaration.includes("export declare const Mintform")) {
    throw new Error("The Mintform component declaration was not generated.");
  }

  return publicDeclaration;
}

execFileSync("tsc", ["-p", "tsconfig.build.json"], {
  cwd: packageDirectory,
  stdio: "inherit",
});

const sourceDeclaration = await readFile(sourceDeclarationPath, "utf8");
const publicDeclaration = removePrivateExports(
  removeStyleImports(sourceDeclaration),
);

await Promise.all([
  writeFile(esmDeclarationPath, publicDeclaration),
  writeFile(cjsDeclarationPath, publicDeclaration),
  writeFile(esmStyleDeclarationPath, styleDeclaration),
  writeFile(cjsStyleDeclarationPath, styleDeclaration),
  rm(sourceDeclarationPath, { force: true }),
  rm(join(distDirectory, "core"), { recursive: true, force: true }),
  rm(join(distDirectory, "runtime"), { recursive: true, force: true }),
]);
