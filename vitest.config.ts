import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["server/**/*.test.ts", "shared/**/*.test.ts"],
    setupFiles: ["./server/__tests__/setup.ts"],
  },
  resolve: {
    alias: {
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
});
