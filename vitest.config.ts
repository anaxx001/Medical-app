import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["artifacts/api-server/src/**/*.test.ts"],
  },
});
