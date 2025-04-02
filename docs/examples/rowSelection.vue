<template>
  <div class="vg-doc-gantt-container">
    <Vue3Gantt
      :getRowId="getRowId"
      :columns="columns"
      :rows="rows"
      :getEmptyRows="getEmptyRows"
      :rowSelection="'multiple'"
      @select-change="onSelectChange"
    ></Vue3Gantt>
  </div>
</template>
<script lang="ts" setup>
import { ref, shallowRef } from 'vue';
import { ColDef, TimeLine, RowData } from 'vue-gantt-3/types';

export interface Row extends RowData {
  id: string;
  name?: string;
  displayStartDate?: string;
  displayEndDate?: string;
  timeLines?: TimeLine[],
}

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

const selectedRowIds = ref<string[]>([]);

const getEmptyRows = (emptyRowCount: number) => {
  const newEmptyRows: Row[] = [];
  for (let i = 0; i < emptyRowCount; i++) {
    newEmptyRows.push({ id: 'empty-row-' + i });
  }
  return newEmptyRows;
};

const onSelectChange = (selectedIds: string[]) => {
  selectedRowIds.value.splice(0);
  selectedIds.forEach(id => {
    selectedRowIds.value.push(id);
  });
};

</script>
<style lang="scss" scoped>
.vg-doc-gantt-container {
  height: 300px;
}
</style>
