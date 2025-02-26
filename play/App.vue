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
import dayjs from 'dayjs';

const getRowId = (rowData: RowData) => (rowData as RowData).id;
const columns = ref<ColumnData[]>([
  {
    field: 'name',
    headerName: '名称',
    resizable: true
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
  getRows();
});

const getRows = () => {
  console.time('getRows');
  const rowDatas: RowData[] = [];
  for (let i = 0; i < 50; i++) {
    const newRow = createRow(i + 1);
    newRow.children = [createRow('firstChild' + i), createRow('secondChild' + i)];
    newRow.children[0].children = [createRow('thirdChild' + i)];
    rowDatas.push(newRow);
  }
  rows.value = rowDatas;
  console.log('rowDatas', rowDatas);
  console.timeEnd('getRows');
};

const getEmptyRows = (emptyRowCount: number) => {
  const newEmptyRows: RowData[] = [];
  for (let i = 0; i < emptyRowCount; i++) {
    newEmptyRows.push({ id: 'empty-row-' + i, modelId: '', loaded: 1 });
  }
  return newEmptyRows;
};

const createRow = (id: string | number): RowData => {
  return {
    id: id.toString(),
    name: '张三',
    displayStartDate: '2023-06-08',
    displayEndDate: '2023-09-20',
    timeLines: createTimeLine(),
  };
};

const createTimeLine = (num = 10) => {
  const timeLines: any[] = [];
  let startYear = 2022;
  for (let i = 1; i <= num; i++) {
    const startDate = createRandomDate(`${startYear}-01-01`, `${startYear}-12-31`);
    startYear++;
    const endDate = createRandomDate(`${startYear}-01-01`, `${startYear}-12-31`);
    startYear++;
    timeLines.push({
      startDate,
      endDate,
      timePoints: [],
      id: 'timeline' + i
    });
  }
  return timeLines;
};

const createRandomDate = (minDate: string, maxDate: string) => {
  const minSecond = dayjs(minDate).unix();
  const maxSecond = dayjs(maxDate).unix();

  if (minSecond < 0 || maxSecond < 0) {
    return '';
  }

  const diffSecond = maxSecond - minSecond;

  if (diffSecond < 0) {
    return '';
  }

  const randomSecond = Math.floor(Math.random() * diffSecond);
  const currentSecond = minSecond + randomSecond;
  return dayjs.unix(currentSecond).format('YYYY-MM-DD HH:mm:ss');
};

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