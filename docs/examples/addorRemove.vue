<template>
  <div class="vg-doc-gantt-container">
    <div class="btn-box">
      <button @click="addRow">Add</button>
      <button @click="removeRow">Remove</button>
    </div>
    <VueGantt3
      :getRowId="getRowId"
      :columns="columns"
      :rows="rows"
      :getEmptyRows="getEmptyRows"
      :rowSelection="'multiple'"
      @select-change="onSelectChange"
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

const addRow = () => {
  const id = (parseInt(rows.value[rows.value.length - 1].id) + 1).toString();
  const newRow = {
    id: id,
    name: 'person' + id,
    displayStartDate: '2025-05-01',
    displayEndDate: '2025-12-01',
    timeLines: [{
      id: id,
      startDate: '2025-05-01',
      endDate: '2025-12-01'
    }]
  };

  const rowData = [...rows.value];
  rowData.push(newRow);
  rows.value = rowData;
};

const removeRow = () => {
  const rowData = [...rows.value].filter(row => {
    return !selectedRowIds.value.includes(row.id);
  });
  rows.value = rowData;
};

</script>
<style lang="scss" scoped>
.vg-doc-gantt-container {
  .vue-gantt-3 {
    height: 300px;
  }
  .btn-box {
    margin-bottom: 12px;
    button {
      padding: 4px 6px;
      border: 1px solid #e9e9e9;
      margin-right: 12px;
    }
  }
}
</style>
