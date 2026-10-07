import { crx } from "@crxjs/vite-plugin";
import path from "node:path";
import { defineConfig } from "vite";
import zip from "vite-plugin-zip-pack";
import manifest from "./manifest.config.js";
import pkg from "./package.json" with { type: "json" };

const __dirname = import.meta.dirname;
export default defineConfig({
	resolve: {
		alias: {
			"@": `${path.resolve(__dirname, "src")}`,
		},
	},
	plugins: [
		crx({ manifest }),
		zip({ outDir: "release", outFileName: `crx-${pkg.name}-${pkg.version}.zip` }),
	],
	server: {
		cors: {
			origin: [/chrome-extension:\/\//],
		},
	},
});
