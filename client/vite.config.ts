import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const tailwindConfigPath = path.resolve(__dirname, "tailwind.config.ts");

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  process.env.VITE_MODE = mode;

  const isBuild = command === "build";

  return {
    base: './', 
    build: {
      outDir: './dist', 
    },
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
      host: true,
      hmr: {
        protocol: "ws",
        host: "localhost",
        timeout: 0,
      },
      // proxy: {
      //   "/server/api": "http://localhost:5000", 
      // },
    // proxy: {
    //   "/server/api": {
    //     target: 'http://localhost:5',
    //     changeOrigin: true,
    //   },
    // },
    },
  };
});
