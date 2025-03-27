import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import dts from "vite-plugin-dts";
import { resolve } from 'path';
import pkg from './package.json';

const projectName = 'vue-gantt-3';
const getTargetDir = (dir: string) => {
  return resolve(projectName, dir);
};
const argv = process.argv;
const isUmd = argv.includes('umd');

const external = isUmd ? ['vue'] : [
  ...Object.keys(pkg.peerDependencies),
  ...Object.keys(pkg.dependencies),
  "dayjs/plugin/minMax",
  "dayjs/plugin/isBetween",
  "dayjs/plugin/quarterOfYear",
  "ag-grid-community/styles/ag-grid.css",
  "ag-grid-community/styles/ag-theme-alpine.css"
];

const output: any[] = isUmd ?
  [
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
  ] : [
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
    }
  ];

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
      'vue-gantt-3': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external,
      output
    },
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: projectName,
    },
  }
});
