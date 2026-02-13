import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import vercel from "vite-plugin-vercel";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [
		tsconfigPaths(),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
		vercel(),
	],
	server: {
		port: (process.env.PORT as unknown as number) ?? 3001,
	},
	ssr: {
		noExternal: ["@convex-dev/better-auth"],
	},
});
