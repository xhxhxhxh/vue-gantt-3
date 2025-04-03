<template>
  <div class="vp-demo">
    <div class="text" v-html="decodedDescription"></div>

    <div class="example">
      <div class="example-showcase">
        <slot name="source" />
      </div>
      <div class="op-btns">
        <span class="img-btn" title="Open in CodeSandBox" @click="openCodeSandBox">
          <svg viewBox="0 0 1024 1024" fill="currentColor"><path d="M755 140.3l0.5-0.3h0.3L512 0 268.3 140h-0.3l0.8 0.4L68.6 256v512L512 1024l443.4-256V256L755 140.3z m-30 506.4v171.2L548 920.1V534.7L883.4 341v215.7l-158.4 90z m-584.4-90.6V340.8L476 534.4v385.7L300 818.5V646.7l-159.4-90.6zM511.7 280l171.1-98.3 166.3 96-336.9 194.5-337-194.6 165.7-95.7L511.7 280z"></path></svg>
        </span>
        <span class="img-btn" title="Edit on Github" @click="openGithub">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M5.883 18.653c-.3-.2-.558-.455-.86-.816a50.32 50.32 0 0 1-.466-.579c-.463-.575-.755-.84-1.057-.949a1 1 0 0 1 .676-1.883c.752.27 1.261.735 1.947 1.588c-.094-.117.34.427.433.539c.19.227.33.365.44.438c.204.137.587.196 1.15.14c.023-.382.094-.753.202-1.095C5.38 15.31 3.7 13.396 3.7 9.64c0-1.24.37-2.356 1.058-3.292c-.218-.894-.185-1.975.302-3.192a1 1 0 0 1 .63-.582c.081-.024.127-.035.208-.047c.803-.123 1.937.17 3.415 1.096A11.731 11.731 0 0 1 12 3.315c.912 0 1.818.104 2.684.308c1.477-.933 2.613-1.226 3.422-1.096c.085.013.157.03.218.05a1 1 0 0 1 .616.58c.487 1.216.52 2.297.302 3.19c.691.936 1.058 2.045 1.058 3.293c0 3.757-1.674 5.665-4.642 6.392c.125.415.19.879.19 1.38a300.492 300.492 0 0 1-.012 2.716a1 1 0 0 1-.019 1.958c-1.139.228-1.983-.532-1.983-1.525l.002-.446l.005-.705c.005-.708.007-1.338.007-1.998c0-.697-.183-1.152-.425-1.36c-.661-.57-.326-1.655.54-1.752c2.967-.333 4.337-1.482 4.337-4.66c0-.955-.312-1.744-.913-2.404a1 1 0 0 1-.19-1.045c.166-.414.237-.957.096-1.614l-.01.003c-.491.139-1.11.44-1.858.949a1 1 0 0 1-.833.135A9.626 9.626 0 0 0 12 5.315c-.89 0-1.772.119-2.592.35a1 1 0 0 1-.83-.134c-.752-.507-1.374-.807-1.868-.947c-.144.653-.073 1.194.092 1.607a1 1 0 0 1-.189 1.045C6.016 7.89 5.7 8.694 5.7 9.64c0 3.172 1.371 4.328 4.322 4.66c.865.097 1.201 1.177.544 1.748c-.192.168-.429.732-.429 1.364v3.15c0 .986-.835 1.725-1.96 1.528a1 1 0 0 1-.04-1.962v-.99c-.91.061-1.662-.088-2.254-.485z"></path></svg>
        </span>
        <span class="img-btn" title="Copy code" @click="copy()">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 6V3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3v3c0 .552-.45 1-1.007 1H4.007A1.001 1.001 0 0 1 3 21l.003-14c0-.552.45-1 1.007-1H7zM5.003 8L5 20h10V8H5.003zM9 6h8v10h2V4H9v2z"></path></svg>
        </span>
        <span class="img-btn" title="View source" @click="toggleSourceVisible()">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="m23 12l-7.071 7.071l-1.414-1.414L20.172 12l-5.657-5.657l1.414-1.414L23 12zM3.828 12l5.657 5.657l-1.414 1.414L1 12l7.071-7.071l1.414 1.414L3.828 12z"></path></svg>
        </span>
      </div>
      <SourceCode :visible="sourceVisible" :source="source" />
      <div v-show="sourceVisible" class="hide-source" @click="toggleSourceVisible()">
        <svg xmlns="http://www.w3.org/2000/svg"
             viewBox="0 0 1024 1024"
             width="16"
             height-16><path fill="currentColor" d="M512 320 192 704h639.936z"></path></svg>
        <span>Hide source</span>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, computed } from 'vue';
import SourceCode from './demo/vp-source-code.vue';
import { isClient, useClipboard, useToggle } from '@vueuse/core';
import pkg from 'vue-gantt-3/vue-gantt-3/package.json';
import * as LZString from "lz-string";

interface IFiles {
  [key: string]: {
    content: string | Record<string, any>;
    isBinary?: boolean;
  };
}

const props = defineProps<{
  source: string
  path: string
  rawSource: string
  description: string
}>();
const decodedDescription = computed(() => decodeURIComponent(props.description));
const [sourceVisible, toggleSourceVisible] = useToggle();

const { copy } = useClipboard({
  source: decodeURIComponent(props.rawSource),
  read: false,
});

const openGithub = () => {
  const url = pkg.homepage + `tree/master/docs/examples/${props.path}.vue`;
  window.open(url);
};

function compress(input: string) {
  return LZString.compressToBase64(input)
    .replace(/\+/g, `-`) // Convert '+' to '-'
    .replace(/\//g, `_`) // Convert '/' to '_'
    .replace(/=+$/, ``); // Remove ending '='
}

const getParameters = (parameters: {
  files: IFiles;
}) => {
  return compress(JSON.stringify(parameters));
};

const openCodeSandBox = () => {
  const parameters = getParameters({
    files: {
      'src/App.vue': {
        content: decodeURIComponent(props.rawSource),
      },
      'src/index.ts': {
        content: `import { createApp } from 'vue';
import App from './App.vue';
import VueGantt3 from 'vue-gantt-3';
import 'vue-gantt-3/es/vue-gantt-3.css';
const app = createApp(App);
app.use(VueGantt3);
app.mount('#app');
        `,
      },
      'index.html': {
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>vue-gantt-3 demo</title>
    <style>
      body {
        padding: 20px;
      }
    </style>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>`
      },
      'package.json': {
        content: {
          dependencies: {
            "vue": "^3.2.0",
            "vue-gantt-3": `^${pkg.version}`,
            "dayjs": "^1.11.10",
          },
          "devDependencies": {
            "typescript": "~5.7.2",
          }
        },
      },
    },
  });

  const url = `https://codesandbox.io/api/v1/sandboxes/define?parameters=${parameters}`;
  window.open(url);
};
</script>
<style lang="scss">
.vp-demo {
  .text {
    font-size: 14px;
    line-height: 20px;
  }
  .example {
    border: 1px solid #e9e9e9;
    border-radius: 4px;
  }
  .example-showcase {

    padding: 24px;
    border-bottom: 1px solid #e9e9e9;
  }
  .op-btns {
    height: 40px;
    padding: 8px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    .img-btn {
      display: inline-block;
      margin: 0 8px;
      width: 16px;
      height: 16px;
      cursor: pointer;
      color: #909399;
      &:hover {
        color: #303133;
      }
      img {
        display: block;
        width: 16px;
        height: 16px;
      }
    }
  }
  .hide-source {
    position: sticky;
    bottom: 0;
    height: 44px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    background-color: #fff;
    color: #909399;
    z-index: 1;
    border-top: 1px solid #e9e9e9;
    &:hover {
      color: #303133;
    }
    span {
      margin-left: 10px;
    }
  }
}
</style>
