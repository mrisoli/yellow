import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    nitro(),
  ],
  server: {
    port: (process.env.PORT as unknown as number) ?? 3001,
  },
  ssr: {
    noExternal: ["@convex-dev/better-auth"],
  },
});
