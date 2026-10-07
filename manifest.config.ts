import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json" with { type: "json" };

export default defineManifest({
	manifest_version: 3,
	name: pkg.name,
	description: pkg.description,
	version: pkg.version,
	icons: {
		48: "public/logo.jpg",
	},
	action: {
		default_icon: {
			48: "public/logo.jpg",
		},
		default_popup: "src/popup/index.html",
	},
	background: {
		service_worker: "src/background/service_worker.ts",
		type: "module",
	},
	content_scripts: [
		{
			js: ["src/content/main.ts"],
			matches: ["https://*/*"],
		},
	],
	permissions: ["contentSettings", "activeTab", "tabs"],
	minimum_chrome_version: "148",
	web_accessible_resources: [
		{
			resources: ["src/assets/KwanUnade -Juri Theme Remix.m4a"],
			matches: ["https://lichess.org/*", "https://chess.com/*"],
		},
	],
});
