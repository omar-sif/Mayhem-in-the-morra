import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
	manifest_version: 3,
	name: pkg.name,
	description: pkg.description,
	version: pkg.version,
	icons: {
		48: "public/logo.png",
	},
	action: {
		default_icon: {
			48: "public/logo.png",
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
	permissions: ["sidePanel", "contentSettings", "activeTab", "tabs"],
	side_panel: {
		default_path: "src/sidepanel/index.html",
	},
	minimum_chrome_version: "148",
	web_accessible_resources: [
		{
			resources: ["src/assets/KwanUnade -Juri Theme Remix.m4a"],
			matches: ["https://lichess.org/*", "https://chess.com/*"],
		},
	],
});
