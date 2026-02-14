import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://ostrea.uk",
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap(),
  ],
  server: {
    host: true,
    port: 4321,
  },
  build: {
    inlineStylesheets: "auto",
  },
});
