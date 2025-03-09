<template>
  <div class="gantt-container">
    <Vue3GanttChart
      ref="mGanttRef"
      :getRowId="getRowId"
      :columns="columns"
      :rows="rows"
      :defaultCol="defaultCol"
      :headerHeight="25"
      :getEmptyRows="getEmptyRows"
      @select-change="onSelectChange"
      @expand-change="onExpandChange"
    ></Vue3GanttChart>
  </div>
</template>
<script lang="ts" setup>
import { ref, onBeforeMount, shallowRef, markRaw } from 'vue';
import { ColumnData, DefaultCol, RowData } from 'vue3-gantt-chart/types';
import { getSingleRow, getMultiRows, getLargeNumRows, getEmptyRows } from './utils/mockData';

const getRowId = (rowData: RowData) => (rowData as RowData).id;
const columns = ref<ColumnData[]>([
  {
    field: 'name',
    headerName: '名称',
    resizable: true,
    cellRendererParams: { expandable: true }
  },
  {
    field: 'displayStartDate',
    headerName: '开始时间',
    resizable: true
  },
  {
    field: 'displayEndDate',
    headerName: '结束时间',
    resizable: true
  }
]);
const selectedRowIds = ref<string[]>([]);
const unExpandRowIds = ref<string[]>([]);

const defaultCol = ref<DefaultCol>({
  resizable: true,
  suppressMovable: true,
  width: 150
});

const rows = shallowRef<RowData[]>([]); // 对于数据量大的情况此处需要用shallowRef，可极大提高初始打开甘特图性能

onBeforeMount(() => {
  rows.value = getLargeNumRows();
});

const onSelectChange = (selectedIds: string[]) => {
  selectedRowIds.value.splice(0);
  selectedIds.forEach(id => {
    selectedRowIds.value.push(id);
  });
};

const onExpandChange = (unExpandIds: string[]) => {
  unExpandRowIds.value = unExpandIds;
};
</script>
<style lang="scss">
html,body,#app {
  height: 100%;
}
body {
  margin: 0;
  padding: 0;
}
.gantt-container {
  height: 100%;
  display: flex;
}
</style>