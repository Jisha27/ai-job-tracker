import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Resolve the `@/*` alias from tsconfig.json (built into Vite; replaces vite-tsconfig-paths).
  resolve: { tsconfigPaths: true },
  test: {
    // Component tests need a DOM; server-side tests opt into Node with `// @vitest-environment node`.
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
