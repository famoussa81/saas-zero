// vitest.config.ts - ESM compatible
import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  resolve: {
    /**
     * Ces alias DOIVENT refléter `paths` de tsconfig.json, sans quoi un test
     * et le code de production ne résolvent pas le même fichier.
     *
     * L'alias précédent était unique — `"@"` vers la racine — alors que
     * tsconfig fait pointer `@/*` sur `./src/*`. Il marchait par accident pour
     * `@/lib` et `@/hooks`, qui vivent bien à la racine, et se trompait pour
     * tout le reste : `@/components/ui/button` résolvait vers
     * `<racine>/components/`, le répertoire fantôme supprimé pour cette raison
     * même. Un test important un composant de `src/` échouait donc sur
     * « Failed to resolve import », ou pire, testait silencieusement l'autre
     * fichier quand les deux existaient.
     *
     * L'ordre compte : le plus spécifique d'abord, comme dans tsconfig.
     */
    alias: [
      { find: /^@\/lib\/(.*)$/, replacement: path.resolve(dirname, "lib/$1") },
      {
        find: /^@\/hooks\/(.*)$/,
        replacement: path.resolve(dirname, "hooks/$1"),
      },
      { find: /^@\/app\/(.*)$/, replacement: path.resolve(dirname, "app/$1") },
      {
        find: /^@\/styles\/(.*)$/,
        replacement: path.resolve(dirname, "src/styles/$1"),
      },
      { find: /^@\/(.*)$/, replacement: path.resolve(dirname, "src/$1") },
    ],
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          globals: true,
          environment: "jsdom",
          setupFiles: ["./tests/setup.ts"],
          include: [
            "tests/unit/**/*.test.{ts,tsx}",
            "tests/contracts/**/*.test.{ts,tsx}",
          ],
          exclude: [
            "tests/e2e/**",
            "tests/visual/**",
            "node_modules/**",
            ".next/**",
          ],
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
        },
      },
    ],
  },
});
