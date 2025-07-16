import * as esbuild from "esbuild";
import { exec } from "child_process";
import stylePlugin from "esbuild-style-plugin";

const isServe = process.argv.includes("--serve");

// Function to pack the ZIP file
function packZip() {
  exec("node .acode/pack-zip.cjs", (err, stdout, stderr) => {
    if (err) {
      console.error("Error packing zip:", err);
      return;
    }
    console.log(stdout.trim());
  });
}

// Custom plugin to pack ZIP after build or rebuild
const zipPlugin = {
  name: "zip-plugin",
  setup(build) {
    build.onEnd(() => {
      packZip();
    });
  },
};

// Base build configuration
let buildConfig = {
  entryPoints: ["src/axon.tsx"],
  loader: {
    ".tsx": "tsx",
    ".ts": "tsx",
    ".js": "jsx",
    ".jsx": "jsx",
    ".css": "css",
  },
  jsx: "automatic",
  jsxFactory: "h",
  bundle: true,
  minify: true,
  logLevel: "info",
  color: true,
  outdir: "dist",
  plugins: [zipPlugin, stylePlugin()],
};

// Main function to handle both serve and production builds
(async function () {
  if (isServe) {
    console.log("Starting development server...");

    // Watch and Serve Mode
    const ctx = await esbuild.context(buildConfig);

    await ctx.watch();
    const { host, port } = await ctx.serve({
      servedir: ".",
      port: 3000,
    });
  } else {
    console.log("Building for production...");
    await esbuild.build(buildConfig);
    console.log("Production build complete.");
  }
})();
