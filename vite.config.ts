import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import dts from "vite-plugin-dts";
import { resolve } from 'path';

const projectName = 'vue3-gantt-chart';
const getTargetDir = (dir: string) => {
  return resolve(projectName, dir);
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: "src",
      outDir: [getTargetDir('es'), getTargetDir('lib')],
      tsconfigPath: "tsconfig.node.json",
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'vue3-gantt-chart': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: [/node_modules/],
      output: [
        {
          format: "umd",
          entryFileNames: "[name].js",
          exports: "named",
          dir: getTargetDir('dist'),
          name: projectName,
          globals: {
            vue: "Vue",
          },
        },
        {
          format: "es",
          entryFileNames: "[name].mjs",
          preserveModules: true,
          dir: getTargetDir('es'),
        },
        {
          format: "cjs",
          entryFileNames: "[name].js",
          preserveModules: true,
          exports: "named",
          dir: getTargetDir('lib'),
        },
      ],
    },
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: projectName,
    },
  }
});
