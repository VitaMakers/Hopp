import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // The app's tsconfig uses jsx:"preserve" (Next transforms JSX); tests run
  // through Vite's oxc transform, which needs an actual JSX transform to
  // import React components.
  oxc: { jsx: { runtime: "automatic", importSource: "react" } },
  test: { include: ["src/**/*.test.ts"] },
});
