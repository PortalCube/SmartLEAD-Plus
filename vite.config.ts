import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

export default defineConfig({
    plugins: [react(), crx({ manifest })],
    server: { port: 3000, hmr: { port: 3000 } },
    build: {
        rollupOptions: {
            input: {
                mainPage: "src/main/index.html",
            },
        },
    },
});
