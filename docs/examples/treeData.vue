<template>
  <div class="vg-doc-gantt-container">
    <VueGantt3
      :getRowId="getRowId"
      :columns="columns"
      :rows="rows"
    ></VueGantt3>
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
  children?: Row[]
}

const getRowId = (rowData: Row) => rowData.id;
const columns = ref<ColDef[]>([
  {
    field: 'name',
    headerName: 'name',
    cellRendererParams: { expandable: true },
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
    }],
    children: [
      {
        id: 'child-1-1',
        name: 'child-1-1',
        displayStartDate: '2025-02-01',
        displayEndDate: '2025-03-01',
        timeLines: [
          {
            id: '1',
            startDate: '2025-02-01',
            endDate: '2025-02-10'
          },
          {
            id: '2',
            startDate: '2025-02-20',
            endDate: '2025-02-25'
          }
        ],
      }
    ]
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
    }],
    children: [
      {
        id: 'child-2-1',
        name: 'child-2-1',
        displayStartDate: '2025-03-01',
        displayEndDate: '2025-06-01',
        timeLines: [
          {
            id: '1',
            startDate: '2025-03-05',
            endDate: '2025-04-10'
          },
          {
            id: '2',
            startDate: '2025-04-20',
            endDate: '2025-05-25'
          }
        ],
      }
    ]
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
    }],
    children: [
      {
        id: 'child-3-1',
        name: 'child-3-1',
        displayStartDate: '2025-05-20',
        displayEndDate: '2025-09-01',
        timeLines: [
          {
            id: '1',
            startDate: '2025-06-05',
            endDate: '2025-07-10'
          },
          {
            id: '2',
            startDate: '2025-08-01',
            endDate: '2025-10-25'
          }
        ],
      }
    ]
  }
]);

</script>
<style lang="scss" scoped>
.vg-doc-gantt-container {
  height: 300px;
}
</style>
