import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  // Use an absolute base so hashed assets (fonts/icons) resolve on deep links.
  base: "/",
  plugins: [react()],
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
});
