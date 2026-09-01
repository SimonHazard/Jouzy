import { cloudflare } from "@cloudflare/vite-plugin";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	server: {
		port: 3002,
	},
	resolve: {
		tsconfigPaths: true,
	},
	plugins: [
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		tailwindcss(),
		tanstackStart({
			router: {
				routeFileIgnorePattern: ".*\\.test\\.tsx$",
			},
		}),
		viteReact(),
		paraglideVitePlugin({
			project: "../../project.inlang",
			outdir: "./src/paraglide",
			emitTsDeclarations: true,
			strategy: ["baseLocale"],
		}),
	],
});
