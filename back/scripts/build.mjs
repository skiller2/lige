// build.mjs (Node ESM)
import { build } from "esbuild";
import { createRequire } from "module";
import {
  join, extname, resolve, dirname, basename, relative
} from "path";
import {
  statSync, existsSync, mkdirSync, copyFileSync,
  readdirSync, readFileSync, realpathSync, lstatSync, rmSync
} from "fs";
import crypto from "crypto";

/** Utility: lowercase .node check (Windows-safe) */
const isNodeBinary = (file) => extname(file).toLowerCase() === ".node";

/** Hash content for change detection (watch/incremental friendly) */
const fileHash = (absPath) => {
  const buf = readFileSync(absPath);
  return crypto.createHash("sha1").update(buf).digest("hex");
};

/** Find nearest package root (folder containing package.json) */
const findPackageRoot = (startDir) => {
  let dir = startDir;
  while (dir && dir !== dirname(dir)) {
    const candidate = join(dir, "package.json");
    if (existsSync(candidate)) return dir;
    dir = dirname(dir);
  }
  return startDir;
};

/** Prefer common native locations; fallback to deep scan only si es necesario */
const findBinaryFiles = (pkgDir) => {
  const results = new Set();

  const tryCollect = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
      const fp = join(dir, entry);
      const st = statSafe(fp);
      if (!st) continue;
      if (st.isDirectory()) {
        tryCollect(fp);
      } else if (isNodeBinary(entry)) {
        results.add(fp);
      }
    }
  };

  const statSafe = (p) => {
    try { return statSync(p); } catch { return null; }
  };

  // Hot spots habituales
  const hotSpots = [
    join(pkgDir, "build", "Release"),
    join(pkgDir, "prebuilds"),
    join(pkgDir, "vendor"),
    join(pkgDir, "bin"),
  ];

  for (const hs of hotSpots) tryCollect(hs);

  // Si no aparece nada en hotspots, como fallback hacemos un escaneo controlado
  if (results.size === 0) {
    tryCollect(pkgDir);
  }

  return Array.from(results);
};

/** Cache compartido entre rebuilds (watch) */
const cache = {
  pkgRootByResolveDir: new Map(),     // resolveDir -> pkgRoot
  binariesByPkgRoot: new Map(),       // pkgRoot -> string[]
  copiedHashes: new Map(),            // outPath -> sha1
  processedPaths: new Set(),          // evita duplicados por ruta
};

/** Copiar sólo si difiere el contenido */
const copyIfChanged = (src, dest) => {
  const srcHash = fileHash(src);
  const prev = cache.copiedHashes.get(dest);
  if (prev === srcHash && existsSync(dest)) return false; // sin cambios
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  cache.copiedHashes.set(dest, srcHash);
  return true;
};

const nativeNodeModulesPlugin = {
  name: "native-node-modules",
  setup(pluginBuild) {
    const require = createRequire(import.meta.url);

    const baseOutdir =
      pluginBuild.initialOptions.outdir ||
      (pluginBuild.initialOptions.outfile
        ? dirname(pluginBuild.initialOptions.outfile)
        : "dist");

    const outdir = resolve(baseOutdir);
    const nativeDir = join(outdir, "native"); // salida: dist/native/<pkg>/**.node
    mkdirSync(nativeDir, { recursive: true });

    // Intercepta el paquete "bindings" (y variantes opcionales)
    const bindingsFilter = /^bindings(?:\/|$)/;
    pluginBuild.onResolve({ filter: bindingsFilter, namespace: "file" }, (args) => {
      let filePath;
      try {
        filePath = require.resolve(args.path, { paths: [args.resolveDir] });
      } catch {
        // Si falla, dejamos que esbuild siga su curso
        return null;
      }

      // Memoiza package root
      let pkgRoot = cache.pkgRootByResolveDir.get(args.resolveDir);
      if (!pkgRoot) {
        // Ojo con symlinks (realpath)
        const real = safeRealpath(args.resolveDir) ?? args.resolveDir;
        pkgRoot = findPackageRoot(real);
        cache.pkgRootByResolveDir.set(args.resolveDir, pkgRoot);
      }

      // Descubre binarios (.node) del paquete y cópialos una vez
      let binaries = cache.binariesByPkgRoot.get(pkgRoot);
      if (!binaries) {
        binaries = findBinaryFiles(pkgRoot);
        cache.binariesByPkgRoot.set(pkgRoot, binaries);
      }

      // Determina nombre del paquete para segmentar la salida
      const pkgJsonPath = join(pkgRoot, "package.json");
      let pkgName = basename(pkgRoot);
      try {
        const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
        if (pkg && typeof pkg.name === "string") {
          // Normaliza a nombre de carpeta válido
          pkgName = pkg.name.replace(/[^\w.-]+/g, "_");
        }
      } catch { /* ignore */ }

      for (const binary of binaries) {
        const rel = relative(pkgRoot, binary); // conserva estructura interna
        const dest = join(nativeDir, pkgName, rel);
        // Dedupe por ruta + hash (rápido en watch/incremental)
        const dedupeKey = `${binary} -> ${dest}`;
        if (!cache.processedPaths.has(dedupeKey)) {
          copyIfChanged(binary, dest);
          cache.processedPaths.add(dedupeKey);
        }
      }

      return {
        path: filePath,
        namespace: "bindings",
      };
    });

    // Reescribe "bindings" para fijar module_root al directorio del bundle
    pluginBuild.onLoad({ filter: /.*/, namespace: "bindings" }, (args) => {
      // Wrapper ESM-friendly. Esbuild hará interop CJS si el consumo es require().
      const contents = `
        import path from "node:path";
        import { createRequire as __createRequire } from "node:module";
        const __require = __createRequire(import.meta.url);
        const __bindings = __require(${JSON.stringify(args.path)});

        // Export default para ESM; compat CJS a través de esbuild interop
        export default function(opts) {
          if (typeof opts === "string") {
            opts = { bindings: opts };
          } else if (!opts) {
            opts = {};
          }
          // muy importante: que apunte al directorio del archivo bundle final
          // (donde ubicamos "dist/native/<pkg>/..."), no al node_modules original
          // Esto preserva la semántica de "bindings" respecto a module_root.
          opts.module_root = path.dirname(import.meta.url).replace(/^file:\\/\\//, "");
          return __bindings(opts);
        }
      `;
      return { contents, loader: "js" };
    });

    // Permite que 'bindings.js' real se resuelva como archivo normal
    pluginBuild.onResolve({ filter: /bindings\.js$/, namespace: "bindings" }, (args) => {
      return { path: args.path, namespace: "file" };
    });

    // Log útil al terminar (qué .node copiamos)
    pluginBuild.onEnd((result) => {
      const copied = Array.from(cache.copiedHashes.keys());
      if (copied.length) {
        console.log(`[native-node-modules] Binarios nativos copiados (${copied.length}):`);
        for (const p of copied) console.log("  •", p);
      }
    });
  },
};

const buildOptions = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  outdir: "dist",
  format: "esm",
  platform: "node",
  target: "node20",       // mejor objetivo concreto que "esnext" para Node
  sourcemap: true,
  splitting: false,       // si es CLI única; habilita true si usarás code-splitting
  treeShaking: true,
  minify: true,          // súbelo a true para producción
  logLevel: "info",
  // Si en algún punto importas .node explícitamente, usa 'file'
  loader: { ".node": "file" },
  plugins: [nativeNodeModulesPlugin],
  banner: {
    js: `
      import { createRequire as topLevelCreateRequire } from 'node:module';
      import { fileURLToPath as __fileURLToPath } from 'node:url';
      import __path from 'node:path';
      const require = topLevelCreateRequire(import.meta.url);
      const __filename = __fileURLToPath(import.meta.url);
      const __dirname = __path.dirname(__filename);
    `,
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
  },
};

await build(buildOptions);

/* Opcional: limpia hashes/cache entre ejecuciones completas (no en watch)
rmSync(join(buildOptions.outdir, 'native'), { recursive: true, force: true });
*/