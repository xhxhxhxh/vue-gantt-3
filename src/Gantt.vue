<template>
  <div ref="vGanttRef" class="vue-gantt-3" @contextmenu.prevent="onContextmenu">
    <ExpandableBox :initWidth="defaultTableViewWidth" :maxWidth="maxTableViewWidth">
      <TableView
        ref="tableViewRef"
        :getRowId="getRowId"
        :columns="columns"
        :defaultCol="defaultCol"
        :rowHeight="rowHeightRef"
        :headerHeight="headerHeight"
        :rowBuffer="rowBuffer"
        :rowSelection="rowSelection"
        :rows="rowDataList"
        :rowNodeMap="rowNodeMap"
        :getEmptyRows="getEmptyRows"
        @trigger-gantt-view-scroll="triggerGanttViewScroll"
        @view-port-changed="onViewPortChanged"
        @cell-double-clicked="onCellDoubleClicked"
      >
      </TableView>
    </ExpandableBox>
    <GanttView
      ref="ganttViewRef"
      :getRowId="getRowId"
      :columns="columns"
      :rows="rowsRef"
      :defaultCol="defaultCol"
      :rowHeight="rowHeightRef"
      :headerHeight="headerHeight"
      :rowBuffer="rowBuffer"
      :rowSelection="rowSelection"
      :rowNodeMap="rowNodeMap"
      :firstLevelRowNode="firstLevelRowNode"
      :visibleRowIds="visibleRowIds"
      :styleOption="styleOption"
      :timePointComp="timePointComp"
      :defaultPerHourSpacing="defaultPerHourSpacing"
      :defaultTimeScale="defaultTimeScale"
      :locale="locale"
      @trigger-table-view-scroll="triggerTableViewScroll"
      @gantt-body-resize="onGanttBodyResize"
      @perHourSpacingChange="perHourSpacingChange"
    ></GanttView>
  </div>
</template>
<script lang="ts" setup>
import TableView from "./components/tableView/TableView.vue";
import GanttView from "./components/ganttView/GanttView.vue";
import type { RowData, ColDef, DefaultColDef, GanttRowNode, GanttStyleOption, TimePoint, MovedTimeLineData, TimeScale } from '@/types';
import { ref, provide, toRef } from 'vue';
import ExpandableBox from './components/common/ExpandableBox.vue';
import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import { useGanttRowNode } from './composables/useGanttRowNode';
import { useGanttSelect } from './composables/useGanttSelect';
import { useGanttExpand } from './composables/useGanttExpand';

dayjs.extend(minMax);

export interface GanttOption {
  getRowId: (rowData: RowData) => string,
  columns?: ColDef[],
  rows?: RowData[],
  getEmptyRows?: (count: number) => RowData[],
  defaultCol?: DefaultColDef,
  rowHeight?: number,
  headerHeight?: number, // table and gantt view header height
  rowBuffer?: number, // The number of rows rendered outside the viewable area the gantt renders
  rowSelection?: 'single' | 'multiple',
  defaultTableViewWidth?: number,
  maxTableViewWidth?: number,
  styleOption?: GanttStyleOption
  timePointComp?: any,
  defaultPerHourSpacing?: number,
  defaultTimeScale?: TimeScale,
  locale?: string,
  defaultShowFirstLevel?: boolean
}
console.log('Gantt');
const props = withDefaults(defineProps<GanttOption>(), {
  defaultTableViewWidth: 350,
  maxTableViewWidth: 1000,
  columns: () => [],
  rows: () => [],
  rowHeight: 25,
  rowBuffer: 5,
  rowSelection: 'multiple',
  headerHeight: 25,
  defaultShowFirstLevel: true
});

const emit = defineEmits<{
  (event: 'selectChange', selectedIds: string[]): void,
  (event: 'expandChange', unExpandRowIds: string[]): void,
  (event: 'rowContextMenu', e: MouseEvent, rowId?: string | null): void,
  (event: 'cellDoubleClicked', rowData: RowData | undefined, columnData?: ColDef): void
  (event: 'ganttMouseDown', e: MouseEvent, rowId?: string | null): void,
  (event: 'timePointMoveFinished', timePoint: TimePoint, date: dayjs.Dayjs): void,
  (event: 'perHourSpacingChange', perHourSpacing: number): void,
  (event: 'timePointContextMenu', e: MouseEvent, timePoints: TimePoint[], rowData?: RowData): void,
  (event: 'timeLineStretchChange', rowId: string, timeLineIds: string[], startDate: dayjs.Dayjs | null, endDate: dayjs.Dayjs | null): void,
  (event: 'timeLineMoveChange', rowId: string, timeLineIds: string[], movedTimeData: MovedTimeLineData[]): void,
  (event: 'viewPortChanged', data: RowData[]): void | Promise<void>,
}>();

const ganttViewRef = ref<InstanceType<typeof GanttView>>();
const tableViewRef = ref<InstanceType<typeof TableView>>();
const vGanttRef = ref<HTMLDivElement>();
const rowsRef = toRef(props, 'rows');
const rowHeightRef = toRef(props, 'rowHeight');
const showFirstLevel = toRef(props, 'defaultShowFirstLevel');
const showSecondLevel = ref(true);
const rowClass = 'vg-row';

provide(
  'showSecondLevel',
  showSecondLevel
);

provide(
  'showFirstLevel',
  showFirstLevel
);

const triggerTableViewScroll = (options: ScrollToOptions, onWheel?: boolean) => {
  tableViewRef.value?.scrollTo(options, onWheel);
};

const triggerGanttViewScroll = (options: ScrollToOptions) => {
  ganttViewRef.value?.scrollTo(options);
};

const emitSelectChange = (ids: string[]) => {
  emit('selectChange', ids);
};

const emitExpandChange = (ids: string[]) => {
  emit('expandChange', ids);
};

const freshTimeLines = (rowIds: string[]) => {
  const rowNodes: GanttRowNode[] = [];
  rowIds.forEach(id => {
    const currentRowNode = rowNodeMap.value.get(id);
    if (currentRowNode) {
      rowNodes.push(currentRowNode);
    }
  });
  ganttViewRef.value && ganttViewRef.value.freshTimeLines(rowNodes);
};

const refreshCells = (ids: string[], force = false) => {
  tableViewRef.value?.refreshCells(ids, force);
};

const onCellDoubleClicked = (data: RowData | undefined, columnData?: ColDef) => {
  emit('cellDoubleClicked', data, columnData);
};

const emitGanttMouseDown = (event: MouseEvent, rowId: string | null) => {
  emit('ganttMouseDown', event, rowId);
};

const onGanttBodyResize = (target: HTMLDivElement) => {
  tableViewRef.value?.handleEmptyRowChanged(target);

};

const onContextmenu = (event: MouseEvent) => {
  const { attributeValue: rowId } = getTargetElementInfo(event.target as HTMLElement | null, rowClass, 'data-row-id');
  emit('rowContextMenu', event, rowId);
};

const timePointMoveFinished = (timePoint: TimePoint, date: dayjs.Dayjs) => {
  emit('timePointMoveFinished', timePoint, date);
};

provide(
  'timePointMoveFinished',
  timePointMoveFinished
);

const perHourSpacingChange = (perHourSpacing: number) => {
  emit('perHourSpacingChange', perHourSpacing);
};

const timePointContextMenu = (e: MouseEvent, timePoints: TimePoint[], rowNode?: GanttRowNode) => {
  if (rowNode) {
    setSelect(rowNode.id);
  }
  emit('timePointContextMenu', e, timePoints, rowNode?.data);
};

provide(
  'timePointContextMenu',
  timePointContextMenu
);

const timeLineStretchChange = (rowId: string, timeLineIds: string[], startDate: dayjs.Dayjs | null, endDate: dayjs.Dayjs | null) => {
  emit('timeLineStretchChange', rowId, timeLineIds, startDate, endDate);
};

provide(
  'timeLineStretchChange',
  timeLineStretchChange
);

const timeLineMoveChange = (rowId: string, timeLineIds: string[], movedTimeData: MovedTimeLineData[]) => {
  emit('timeLineMoveChange', rowId, timeLineIds, movedTimeData);
};

provide(
  'timeLineMoveChange',
  timeLineMoveChange
);

/**
 * when visual area Changed notice user
 * @param data
 */
const onViewPortChanged = (data: RowData[]) => {
  emit('viewPortChanged', data);
};

const setSelect = (id: string) => {
  handleSetSelect(id);
};

const setExpand = (id: string, expand: boolean) => {
  handleSetExpand(id, expand);
};

const {
  rowNodeMap,
  rowNodeIds,
  visibleRowIds,
  rowDataList,
  firstLevelRowNode,
  getRowNode,
  getRowNodeChildren,
  getRowDataList,
  freshRowNodes,
  getDisplayRows
} = useGanttRowNode({
  ganttViewRef,
  tableViewRef,
  rows: rowsRef,
  getRowId: props.getRowId,
  setExpand,
  setSelect,
  refreshCells,
  onViewPortChanged
});

const {
  handleSetSelect,
  selectRows,
  getTargetElementInfo
} = useGanttSelect({ vGanttRef, visibleRowIds, rowHeight: rowHeightRef, rowClass, emitGanttMouseDown, emitSelectChange });

const {
  handleSetExpand,
  expandAll
} = useGanttExpand({
  tableViewRef,
  rowNodeMap,
  visibleRowIds,
  rowNodeIds,
  refreshCells,
  emitExpandChange
});

defineExpose({
  getRowNode,
  getRowNodeChildren,
  getRowDataList,
  freshRowNodes,
  refreshCells,
  getDisplayRows,
  expandAll,
  freshTimeLines,
  selectRows,
});

defineOptions({
  name: 'Vue3Gantt',
});

</script>
<style lang="scss">
.vue-gantt-3 {
  width: 100%;
  height: 100%;
  min-height: 300px;
  display: flex;
  overflow: hidden;
  box-sizing: border-box;
  border: 1px solid #e9e9e9;
  background-color: #fff;
  *, :before, :after {
    box-sizing: border-box;
  }
  img {
    border: 0;
    vertical-align: middle;
    -webkit-user-drag: none;
    user-select: none;
  }
  .c-expandable-box {
    ._drag-line {
      right: -4px !important;
    }
    margin-right: 4px;
  }
  .vg-table-view {
    border-right: 1px solid #e9e9e9;
  }
  .vg-gantt-view {
    flex: 1;
    border-left: 1px solid #e9e9e9;
  }
}
</style>