import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // Client test files use JSX without importing React (same as the Vite app).
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    globals: true,
    include: [
      "server/**/*.test.ts",
      "shared/**/*.test.ts",
      "client/src/**/*.test.tsx",
    ],
    // Client component tests run in a browser-like DOM; server/shared tests
    // stay in the plain node environment.
    environmentMatchGlobs: [["client/**", "jsdom"]],
    setupFiles: ["./server/__tests__/setup.ts"],
  },
  resolve: {
    alias: {
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@": path.resolve(import.meta.dirname, "client", "src"),
    },
  },
});
