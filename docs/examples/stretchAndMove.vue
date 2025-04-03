<template>
  <div class="vg-doc-gantt-container">
    <VueGantt3
      :getRowId="getRowId"
      :columns="columns"
      :rows="rows"
      :styleOption="styleOption"
      @time-line-stretch-change="onTimeLineStretchChange"
      @time-line-move-change="onTimeLineMoveChange"
    ></VueGantt3>
  </div>
</template>
<script lang="ts" setup>
import { ref, shallowRef } from 'vue';
import { ColDef, TimeLine, RowData, GanttStyleOption, MovedTimeLineData } from 'vue-gantt-3/types';
import type { Dayjs } from 'dayjs';

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
      endDate: '2025-08-01',
      disableStretch: true
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
      endDate: '2025-12-01',
      disableMove: true
    }]
  }
]);

const onTimeLineStretchChange = (rowId: string, timeLineIds: string[], startDate: Dayjs, endDate: Dayjs) => {
  console.log('onTimeLineStretchChange', rowId, timeLineIds, startDate, endDate);
};

const onTimeLineMoveChange = (rowId: string, timeLineIds: string[], movedTimeData: MovedTimeLineData) => {
  console.log('onTimeLineMoveChange', rowId, timeLineIds, movedTimeData);
};

const styleOption = ref<GanttStyleOption>({
  // disableMove: true,
  // disableStretch: true
});

</script>
<style lang="scss" scoped>
.vg-doc-gantt-container {
  height: 200px;
}
</style>
