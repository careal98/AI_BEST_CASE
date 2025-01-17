import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const tailwindConfigPath = path.resolve(__dirname, "tailwind.config.ts");

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  process.env.VITE_MODE = mode;

  const isBuild = command === "build";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        src: "/src",
        "tailwind.config": tailwindConfigPath,
      },
    },
    optimizeDeps: {
      include: [tailwindConfigPath],
    },
    esbuild: {
      drop: isBuild ? ["console"] : undefined,
    },
    server: {
      // port: 3000,
      host: true,
      hmr: {
        protocol: "ws",
        host: "localhost",
        timeout: 0,
      },
      // proxy: {
      //   "/api": "http://localhost:5000",
      // },
    },
    base: './', // 상대 경로 설정
    build: {
      outDir: 'dist',
    },
  };
});
