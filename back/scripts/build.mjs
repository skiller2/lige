import { build } from "esbuild";

import { join,extname,resolve,dirname,basename } from "path";
import { statSync,existsSync,mkdirSync,copyFileSync,readdirSync } from "fs";

const findBinaryFiles = (dir) => {
   const binaries = [];
   const files = readdirSync(dir);
   for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
         binaries.push(...findBinaryFiles(filePath));
      } else if (extname(file) === ".node") {
         binaries.push(filePath);
      }
   }
   return binaries;
};


const nativeNodeModulesPlugin = {
   name: "native-node-modules",
   setup(build) {
      const baseOutdir = build.initialOptions.outdir || dirname(build.initialOptions.outfile);
      const outdir = resolve(baseOutdir);
      const buildDir = join(outdir, 'build');
      
      if (!existsSync(outdir)) mkdirSync(outdir);
      if (!existsSync(buildDir)) mkdirSync(buildDir);

      const processedBinaries = new Set();
      
      build.onResolve({ filter: /bindings/, namespace: "file" }, (args) => {
         const filePath =  require.resolve(args.path, { paths: [args.resolveDir] });
         const { resolveDir } = args;
         let packageDir = dirname(resolveDir);
         while(packageDir && basename(packageDir) !== "node_modules") {
            packageDir = dirname(packageDir);
         }
         packageDir = dirname(packageDir);

         // find '.node' files in the packageDir
         const binaries = findBinaryFiles(packageDir);
         binaries.forEach((binary) => {
            const fname = basename(binary);
            if (!processedBinaries.has(fname)) {
               const outPath = join(buildDir, fname);
               copyFileSync(binary, outPath);
               processedBinaries.add(fname);
            }
         });
         
         return {
            path: filePath,
            namespace: "bindings",
         };
      });

      build.onLoad({ filter: /.*/, namespace: "bindings" }, (args) => {
         return {
            contents: `
            const path = require("path");
            const fs = require("fs");
            const __bindings = require(${JSON.stringify(args.path)});

            module.exports = function(opts) {
               if (typeof opts == "string") {
                  opts = { bindings: opts };
               } else if (!opts) {
                  opts = {};
               }

               opts.module_root = path.dirname(__filename);
               return __bindings(opts);
            };
          `,
         };
      });

      build.onResolve({ filter: /bindings\.js$/, namespace: "bindings" }, (args) => {
         return {
            path: args.path,
            namespace: "file",
         };
      });
   },
};

const buildOptions = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  outdir: "dist",
  format: "esm",
  target: "esnext",
  platform: "node",
  logLevel: "info",
  loader:{'.node':'copy'},
plugins: [nativeNodeModulesPlugin],
  banner: {
    js: `
    import { createRequire as topLevelCreateRequire } from 'module'
    const require = topLevelCreateRequire(import.meta.url)

    const __filename = import.meta.filename
    const __dirname = import.meta.dirname


    
    `,
  },
};

await build({
  ...buildOptions,
});
