<template>
  <div class="gantt-container">
    <Vue3Gantt
      ref="vgGanttRef"
      :getRowId="getRowId"
      :columns="columns"
      :rows="rows"
      :defaultCol="defaultCol"
      :headerHeight="25"
      :getEmptyRows="getEmptyRows"
      @select-change="onSelectChange"
      @expand-change="onExpandChange"
    ></Vue3Gantt>
  </div>
</template>
<script lang="ts" setup>
import { ref, onBeforeMount, shallowRef, markRaw } from 'vue';
import { ColDef, DefaultColDef } from 'vue-gantt-3/types';
import type { ValueSetterParams } from 'ag-grid-community';
import { getSingleRow, getMultiRows, getLargeNumRows, getEmptyRows } from './utils/mockData';
import CellRender from './components/CellRender.vue';
import Vue3GanttInstance from 'vue-gantt-3';
import { Row } from './types';

const vgGanttRef = ref<InstanceType<typeof Vue3GanttInstance> | undefined>();

const getRowId = (rowData: Row) => rowData.id;
const columns = ref<ColDef[]>([
  {
    field: 'name',
    headerName: 'name',
    resizable: true,
    cellRendererParams: { expandable: true },
  },
  {
    field: 'displayStartDate',
    headerName: 'start date',
    resizable: true,
  },
  {
    field: 'displayEndDate',
    headerName: 'end date',
    resizable: true,
  },
  {
    field: 'blank',
    headerName: '',
    resizable: false,
    cellStyle: { borderRight: 0 }
  }
]);
const selectedRowIds = ref<string[]>([]);
const unExpandRowIds = ref<string[]>([]);

// For a large amount of data, shallowRef should be used here, which can greatly improve the performance of initial Gantt
const rows = shallowRef<Row[]>([]);
const defaultCol = ref<DefaultColDef>({
  resizable: true,
  suppressMovable: true,
  width: 150,
  cellRenderer: markRaw(CellRender),
  valueSetter: (params: ValueSetterParams<Omit<Row, 'children'>, any>) => {
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
        vgGanttRef.value && vgGanttRef.value.freshRowNodes([row]);
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