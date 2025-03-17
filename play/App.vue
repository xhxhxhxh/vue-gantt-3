<template>
  <div class="gantt-container">
    <Vue3GanttChart
      ref="vgGanttRef"
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
import { ColDef, DefaultColDef, RowData } from 'vue3-gantt-chart/types';
import type { ValueSetterParams } from 'ag-grid-community';
import { getSingleRow, getMultiRows, getLargeNumRows, getEmptyRows } from './utils/mockData';
import CellRender from './components/CellRender.vue';
import Vue3GanttChart from 'vue3-gantt-chart';

const vgGanttRef = ref<InstanceType<typeof Vue3GanttChart> | undefined>();

const getRowId = (rowData: RowData) => (rowData as RowData).id;
const columns = ref<ColDef[]>([
  {
    field: 'name',
    headerName: '名称',
    resizable: true,
    cellRendererParams: { expandable: true },
  },
  {
    field: 'displayStartDate',
    headerName: '开始时间',
    resizable: true,
  },
  {
    field: 'displayEndDate',
    headerName: '结束时间',
    resizable: true,
  }
]);
const selectedRowIds = ref<string[]>([]);
const unExpandRowIds = ref<string[]>([]);

const rows = shallowRef<RowData[]>([]); // 对于数据量大的情况此处需要用shallowRef，可极大提高初始打开甘特图性能
const defaultCol = ref<DefaultColDef>({
  resizable: true,
  suppressMovable: true,
  width: 150,
  cellRenderer: markRaw(CellRender),
  valueSetter: (params: ValueSetterParams<RowData, any>) => {
    const field = params.colDef.field || '';
    const newValue = params.newValue;
    const row = params.data;
    row[field] = newValue;
    if (field === 'displayStartDate' || field === 'displayEndDate') {
      const timeLines = row.timeLines;
      if (timeLines) {
        if (field === 'displayStartDate') {
          timeLines[0].startDate = newValue;
        } else {
          timeLines[timeLines.length - 1].endDate = newValue;
        }
        vgGanttRef.value.freshRowNodes([row]);
      }
    }
    return true;
  }
});
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