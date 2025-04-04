# vue-gantt-3 [![npm](https://img.shields.io/npm/v/vue-gantt-3.svg)](https://www.npmjs.com/package/vue-gantt-3) [![NPM downloads](https://img.shields.io/npm/dm/vue-gantt-3?style=flat)](https://www.npmjs.com/package/vue-gantt-3) [![license](https://img.shields.io/npm/l/vue-gantt-3.svg?maxAge=2592000)](http://www.opensource.org/licenses/mit-license.php)

**English** | [中文](./README-CN.md)

A Gantt component for vue3. High performance(global virtual scroll), support time line move and stretch, change the time scale arbitrarily etc. The table part of the component bases on [ag-grid](https://github.com/ag-grid/ag-grid).

<div align="center">
  <img src="./public/gantt-preview.png" alt="gantt preview">
</div>

## API & Examples

- Please visit [vue-gantt-3](https://xhxhxhxh.github.io/)

## Install

```
npm install vue-gantt-3
```
or

```
yarn add vue-gantt-3
```
or

```
pnpm install vue-gantt-3
```

## Usage

Write the following in main.js:

```javascript
import { createApp } from 'vue';
import App from './App.vue';
import VueGantt3 from 'vue-gantt-3';

const app = createApp(App);
app.use(VueGantt3);
app.mount('#app');
```

Example for App.vue:

```javascript
<template>
  <VueGantt3
      :getRowId="getRowId"
      :columns="columns"
      :rows="rows"
    ></VueGantt3>
</template>

<script lang="ts" setup>
  const getRowId = (rowData) => rowData.id;
  const columns = ref([
  {
    field: 'name',
    headerName: 'name',
    resizable: true,
    cellRendererParams: { expandable: true },
  },
  {
    field: 'displayStartDate',
    headerName: 'Start Date',
    resizable: true,
  },
  {
    field: 'displayEndDate',
    headerName: 'End Date',
    resizable: true,
  }
]);
const rows = shallowRef([
   {
    id: '1',
    name: 'person 01',
    displayStartDate: '2025-01-01',
    displayEndDate: '2025-05-01',
    timeLines: [{
      id: '1',
      startDate: '2025-01-01',
      endDate: '2025-05-01'
    }]
  },
  {
    id: '2',
    name: 'person 02',
    displayStartDate: '2025-03-01',
    displayEndDate: '2025-08-01',
    timeLines: [{
      id: '2',
      startDate: '2025-03-01',
      endDate: '2025-08-01'
    }]
  },
  {
    id: '3',
    name: 'person 03',
    displayStartDate: '2025-05-01',
    displayEndDate: '2025-12-01',
    timeLines: [{
      id: '3',
      startDate: '2025-05-01',
      endDate: '2025-12-01'
    }]
  }
]);
</script>
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE) file for details
