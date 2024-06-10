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
  external: ['sharp'],
  banner: {
    js: `
    import { createRequire as topLevelCreateRequire } from 'module'
    const require = topLevelCreateRequire(import.meta.url)

    const __dirname = import.meta.dirname
    `,
  },
};

await build({
  ...buildOptions,
});
