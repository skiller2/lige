import { build } from "esbuild";

const buildOptions = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  outfile: "dist/index.js",
  format: "esm",
  target: "esnext",
  platform: "node",
  logLevel: "info",
  loader:{'.node':'copy'},

  banner: {
    js: `
    import path from 'path';
    //import { fileURLToPath } from 'url';
    import { createRequire as topLevelCreateRequire } from 'module';
    const require = topLevelCreateRequire(import.meta.url);
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    `,
  },
};

await build({
  ...buildOptions,
});
