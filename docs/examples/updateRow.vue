<template>
  <div class="vg-doc-gantt-container">
    <VueGantt3
      ref="vgGanttRef"
      :getRowId="getRowId"
      :columns="columns"
      :rows="rows"
      :getEmptyRows="getEmptyRows"
      :defaultCol="defaultCol"
    ></VueGantt3>
  </div>
</template>
<script lang="ts" setup>
import { ref, shallowRef, markRaw, defineComponent, h, computed, watch, withDirectives } from 'vue';
import { ColDef, TimeLine, RowData, DefaultColDef, ValueSetterParams } from 'vue-gantt-3/types';
import VueGantt3Instance from 'vue-gantt-3';

export interface Row extends RowData {
  id: string;
  name?: string;
  displayStartDate?: string;
  displayEndDate?: string;
  timeLines?: TimeLine[],
}

const vgGanttRef = ref<InstanceType<typeof VueGantt3Instance> | undefined>();

const CellRender = defineComponent(
  (props: { params }) => {
    const field = ref(props.params.colDef.field as string);
    const vFocus = {
      mounted: (el: HTMLInputElement) => {
        el.focus();
      }
    };
    const rowValue = computed(() => {
      return props.params.data[field.value] as string;
    });
    const inputValue = ref(rowValue.value);

    watch(rowValue, val => {
      inputValue.value = val;
    });

    const isEdit = ref(false);

    const handleDbClick = () => {
      isEdit.value = true;
    };

    const handleBlur = (e: FocusEvent) => {
      isEdit.value = false;
      props.params.setValue(inputValue.value);
    };

    return () => {
      return h('div', { onDblclick: handleDbClick }, [
        isEdit.value ?
          withDirectives(h('input', {
            value: inputValue.value,
            onInput: (e: any) => {
              inputValue.value = e.target.value;
            },
            onBlur: handleBlur
          }), [[vFocus]]) :
          h('span', rowValue.value)
      ]);
    };
  },
  // 目前仍然需要手动声明运行时的 props
  {
    props: ['params']
  }
);

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
  height: 250px;
}
</style>
