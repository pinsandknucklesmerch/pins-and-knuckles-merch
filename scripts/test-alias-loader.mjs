import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { fileURLToPath, pathToFileURL } from "node:url";

const sourceRoot = path.resolve(fileURLToPath(new URL("../src/", import.meta.url)));
const projectRoot = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs"];

function resolveSourcePath(relativePath) {
  const base = path.resolve(sourceRoot, relativePath);
  const candidates = [base, ...extensions.map((extension) => `${base}${extension}`), ...extensions.map((extension) => path.join(base, `index${extension}`))];
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null;
}

function resolveRelativePath(specifier, parentURL) {
  if (!parentURL?.startsWith("file:")) return null;
  const parentPath = fileURLToPath(parentURL);
  const base = path.resolve(path.dirname(parentPath), specifier);
  const candidates = [base, ...extensions.map((extension) => `${base}${extension}`), ...extensions.map((extension) => path.join(base, `index${extension}`))];
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null;
}

function resolvePackagePath(specifier) {
  if (specifier.startsWith("node:") || specifier.startsWith("file:") || specifier.startsWith(".")) return null;
  const parts = specifier.split("/");
  const packageName = specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
  const subpath = parts.slice(specifier.startsWith("@") ? 2 : 1).join("/");
  const base = path.join(projectRoot, "node_modules", packageName, subpath);
  const candidates = [base, ...extensions.map((extension) => `${base}${extension}`), ...extensions.map((extension) => path.join(base, `index${extension}`))];
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return { shortCircuit: true, url: pathToFileURL(path.resolve(projectRoot, "scripts/test-server-only-shim.mjs")).href };
  }
  if (specifier.startsWith("@/")) {
    const sourcePath = resolveSourcePath(specifier.slice(2));
    if (sourcePath) return { shortCircuit: true, url: pathToFileURL(sourcePath).href };
  }
  if (specifier.startsWith(".")) {
    const sourcePath = resolveRelativePath(specifier, context.parentURL);
    if (sourcePath) return { shortCircuit: true, url: pathToFileURL(sourcePath).href };
  }
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    const packagePath = resolvePackagePath(specifier);
    if (packagePath) return { shortCircuit: true, url: pathToFileURL(packagePath).href };
    throw error;
  }
}

export async function load(url, context, nextLoad) {
  if (url.endsWith(".tsx")) {
    const source = fs.readFileSync(fileURLToPath(url), "utf8");
    const transformed = ts.transpileModule(source, {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      fileName: fileURLToPath(url),
    });
    return { format: "module", source: transformed.outputText, shortCircuit: true };
  }
  return nextLoad(url, context);
}
