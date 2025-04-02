<template>
  <div class="vg-doc-gantt-container">
    <Vue3Gantt
      ref="vgGanttRef"
      :getRowId="getRowId"
      :columns="columns"
      :rows="rows"
      :getEmptyRows="getEmptyRows"
      :defaultCol="defaultCol"
    ></Vue3Gantt>
  </div>
</template>
<script lang="ts" setup>
import { ref, shallowRef, markRaw } from 'vue';
import { ColDef, TimeLine, RowData, DefaultColDef, ValueSetterParams } from 'vue-gantt-3/types';
import Vue3GanttInstance from 'vue-gantt-3';
import CellRender from './CellRender.vue';

export interface Row extends RowData {
  id: string;
  name?: string;
  displayStartDate?: string;
  displayEndDate?: string;
  timeLines?: TimeLine[],
}

const vgGanttRef = ref<InstanceType<typeof Vue3GanttInstance> | undefined>();

const getRowId = (rowData: Row) => rowData.id;
const columns = ref<ColDef[]>([
  {
    field: 'name',
    headerName: 'name',
  },
  {
    field: 'displayStartDate',
    headerName: 'start date',
  },
  {
    field: 'displayEndDate',
    headerName: 'end date',
  },
  {
    field: 'blank',
    headerName: '',
    cellStyle: { borderRight: 0 }
  }
]);

const defaultCol = ref<DefaultColDef>({
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

// For a large amount of data, shallowRef should be used here,
// which can greatly improve the performance of initial Gantt
const rows = shallowRef<Row[]>([
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

const getEmptyRows = (emptyRowCount: number) => {
  const newEmptyRows: Row[] = [];
  for (let i = 0; i < emptyRowCount; i++) {
    newEmptyRows.push({ id: 'empty-row-' + i });
  }
  return newEmptyRows;
};

</script>
<style lang="scss" scoped>
.vg-doc-gantt-container {
  height: 300px;
}
</style>
