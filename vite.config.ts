// vite.config.ts (или vite.config.js)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // или 'localhost'
    port: 5173, // ваш желаемый порт
    // origin: 'http://ваш.вдс.ип.адрес:5173' // (опционально, для некоторых случаев HMR)
  },
});
