<template>
  <div ref="vGanttRef" class="vue3-gantt-chart" @contextmenu.prevent="onContextmenu">
    <ExpandableBox :initWidth="defaultTableViewWidth" :maxWidth="maxTableViewWidth">
      <TableView
        ref="tableViewRef"
        :getRowId="getRowId"
        :columns="columns"
        :defaultCol="defaultCol"
        :rowHeight="rowHeight"
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
      :rows="rows"
      :defaultCol="defaultCol"
      :rowHeight="rowHeight"
      :headerHeight="headerHeight"
      :rowBuffer="rowBuffer"
      :rowSelection="rowSelection"
      :rowNodeMap="rowNodeMap"
      :firstLevelRowNode="firstLevelRowNode"
      :visibleRowIds="visibleRowIds"
      :styleOption="styleOption"
      :timePointComp="timePointComp"
      :defaultPerHourSpacing="defaultPerHourSpacing"
      @trigger-table-view-scroll="triggerTableViewScroll"
      @gantt-body-resize="onGanttBodyResize"
      @perHourSpacingChange="perHourSpacingChange"
    ></GanttView>
  </div>
</template>
<script lang="ts" setup>
import TableView from "./components/tableView/TableView.vue";
import GanttView from "./components/ganttView/GanttView.vue";
import type { RowData, ColDef, DefaultColDef, GanttRowNode, GanttStyleOption, TimePoint, MovedTimeLineData } from '@/types';
import { ref, provide } from 'vue';
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
  headerHeight?: number, // 最顶部的行高
  rowBuffer?: number, // 缓冲行数，表示可视区域之外上下各渲染多少行
  rowSelection?: 'single' | 'multiple',
  defaultTableViewWidth?: number,
  maxTableViewWidth?: number,
  styleOption?: GanttStyleOption
  timePointComp?: any,
  defaultPerHourSpacing?: number
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
  headerHeight: 25
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
const showSecondLevel = ref(true);
const rowClass = 'vg-row';

provide(
  'showSecondLevel',
  showSecondLevel
);

const triggerTableViewScroll = (options: ScrollToOptions, triggerScrollBar?: boolean) => {
  tableViewRef.value?.scrollTo(options, triggerScrollBar);
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
  rows: props.rows,
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
} = useGanttSelect({ vGanttRef, visibleRowIds, rowHeight: props.rowHeight, rowClass, emitGanttMouseDown, emitSelectChange });

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
  name: 'Vue3GanttChart',
});

</script>
<style lang="scss">
.vue3-gantt-chart {
  width: 100%;
  height: 100%;
  display: flex;
  overflow: hidden;
  box-sizing: border-box;
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