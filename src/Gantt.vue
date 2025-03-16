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
import type { RowData, ColDef, DefaultColDef, GanttRowNode, MGanttStyleOption, TimePoint, MovedTimeLineData } from '@/types';
import { ref, provide, onMounted, onBeforeUnmount, onBeforeMount, shallowRef, watch } from 'vue';
import ExpandableBox from './components/common/ExpandableBox.vue';
import dayjs from 'dayjs';
import { treeForEachSkipChildren } from "@/utils/common";
import minMax from 'dayjs/plugin/minMax';
import { useGanttRowNode } from './composables/useGanttRowNode';

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
  styleOption?: MGanttStyleOption
  timePointComp?: any,
  defaultPerHourSpacing?: number
}
console.log('MGantt');
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
const selectedRowIds = ref<Set<string>>(new Set());
const vGanttRef = ref<HTMLDivElement>();
const unExpandRowIds = new Set<string>();
const showSecondLevel = ref(true);
let lastMouseMoveTarget: HTMLElement | null = null;
let lastClickedRowId = '';
let lastClickedRowIndex = 0;
const rowClass = 'vg-row';

provide(
  'selectedRowIds',
  selectedRowIds
);

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

onMounted(() => {
  vGanttRef.value?.addEventListener('mousedown', handleGanttMouseDown);
});

onBeforeUnmount(() => {
  vGanttRef.value?.removeEventListener('mousedown', handleGanttMouseDown);
});

watch(selectedRowIds, (val) => {
  emit('selectChange', [...val]);
}, { deep: true });

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

const setExpand = (id: string, expand: boolean) => {
  const currentRowNode = rowNodeMap.value.get(id);
  if (currentRowNode) {
    const startIndex = visibleRowIds.value.findIndex(rowId => rowId === id);
    const affectChildren = getAffectChildren(currentRowNode);
    const newVisibleRowIds = visibleRowIds.value.concat([]);
    const affectChildrenIds = affectChildren.map(item => item.id);
    if (expand) {
      newVisibleRowIds.splice(startIndex + 1, 0, ...affectChildrenIds);
      unExpandRowIds.delete(id);
    } else {
      newVisibleRowIds.splice(startIndex + 1, affectChildren.length);
      unExpandRowIds.add(id);
    }
    emit('expandChange', [...unExpandRowIds]);
    affectChildren.forEach(node => node.hide = !expand);
    visibleRowIds.value = newVisibleRowIds;
    currentRowNode.expand = expand;
    tableViewRef.value?.onFilterChanged();
    refreshCells([id], true);
  }
};

const refreshCells = (ids: string[], force = false) => {
  tableViewRef.value?.refreshCells(ids, force);
};

const expandAll = () => {
  visibleRowIds.value = rowNodeIds.value.concat([]);
  for (let id of unExpandRowIds) {
    const currentRowNode = rowNodeMap.value.get(id);
    if (currentRowNode) {
      const affectChildren = getAffectChildren(currentRowNode);
      affectChildren.forEach(node => node.hide = false);
      currentRowNode.expand = true;
    }
  }
  tableViewRef.value?.onFilterChanged();
  refreshCells([...unExpandRowIds], true);
  unExpandRowIds.clear();
  emit('expandChange', [...unExpandRowIds]);
};

const getAffectChildren = (rowNode: GanttRowNode) => {
  let children = rowNode.children || [];
  const result: GanttRowNode[] = [];

  treeForEachSkipChildren(children, (currentRowNode) => {
    result.push(currentRowNode);
    if (!currentRowNode.expand) {
      return 'skipChildren';
    }
  });

  return result;
};

const onCellDoubleClicked = (data: RowData | undefined, columnData?: ColDef) => {
  emit('cellDoubleClicked', data, columnData);
};

const setSelect = (id: string) => {
  selectedRowIds.value.clear();
  selectedRowIds.value.add(id);
};

const selectRows = (ids: string[]) => {
  selectedRowIds.value = new Set(ids);
};

const handleRowSelect = (rowId: string, event: MouseEvent, rowIndex:number, onShift?: boolean) => {
  const pressCtrl = event?.ctrlKey;
  const pressShift = event?.shiftKey || onShift;
  const isContextmenuClick = event?.type === 'contextmenu';
  const selectedRowIdSize = selectedRowIds.value.size;

  if (!pressCtrl || isContextmenuClick) {
    selectedRowIds.value.clear();
  }

  if (pressCtrl && !pressShift) {
    if (selectedRowIds.value.has(rowId)) {
      selectedRowIds.value.delete(rowId);
      return;
    }
  }

  // shift处理
  if (pressShift && !isContextmenuClick && selectedRowIdSize > 0 && lastClickedRowId !== rowId) {
    const bigRowIndex = Math.max(rowIndex, lastClickedRowIndex);
    const smallRowIndex = Math.min(rowIndex, lastClickedRowIndex);
    const willSelectedRowIds = visibleRowIds.value.slice(smallRowIndex, bigRowIndex + 1);
    for (let id of willSelectedRowIds) {
      selectedRowIds.value.add(id);
    }
  } else {
    selectedRowIds.value.add(rowId);
    lastClickedRowId = rowId;
    lastClickedRowIndex = rowIndex;
  }
};

function handleGanttMouseDown (this: HTMLElement, event: MouseEvent) {
  const { target, attributeValue: rowId, rowIndex } = getTargetElementInfo(event.target as HTMLElement | null, rowClass, 'data-row-id');
  emit('ganttMouseDown', event, rowId);
  if (target) {
    const isLeftMouse = event.button === 0;
    if (rowId) {
      handleRowSelect(rowId, event, rowIndex);
    } else {
      selectedRowIds.value.clear();
      return;
    }
    if (isLeftMouse) {
      this.addEventListener('mousemove', handleGanttMouseMove);
      document.addEventListener('mouseup', handleGanttMouseUp);
    }
  } else {
    const { target: ganttBodyRef } = getTargetElementInfo(event.target as HTMLElement | null, 'vg-body');
    if (ganttBodyRef) {
      selectedRowIds.value.clear();
    }

  }
}

function handleGanttMouseMove(event: MouseEvent) {
  const { target, attributeValue: rowId, rowIndex } = getTargetElementInfo(event.target as HTMLElement | null, rowClass, 'data-row-id');
  if (target && lastMouseMoveTarget !== target) {
    lastMouseMoveTarget = target;
    if (rowId) {
      console.log('handleGanttMouseMove');
      handleRowSelect(rowId, event, rowIndex, true);
    }
  }
}

function handleGanttMouseUp() {
  vGanttRef.value?.removeEventListener('mousemove', handleGanttMouseMove);
  document.removeEventListener('mouseup', handleGanttMouseUp);
}

const onGanttBodyResize = (target: HTMLDivElement) => {
  tableViewRef.value?.handleEmptyRowChanged(target);

};

const onContextmenu = (event: MouseEvent) => {
  const { attributeValue: rowId } = getTargetElementInfo(event.target as HTMLElement | null, rowClass, 'data-row-id');
  emit('rowContextMenu', event, rowId);
};

const getTargetElementInfo = (initialTarget: HTMLElement | null, targetClass: string, attribute?: string) => {
  let target = initialTarget;
  let attributeValue: string | null = '';
  let rowIndex = 0;
  while (target && !target.classList.contains(targetClass)) {
    target = target?.parentElement;
  }

  if (target && attribute) {
    attributeValue = target.getAttribute(attribute);
    const transform = target.style.transform;
    const transfromYStr = transform.match(/translateY\((.+)px\)/)?.[1];
    if (transfromYStr) {
      const transfromY = parseFloat(transfromYStr);
      // 此处需要四舍五入，防止当值过大时浏览器采用科学计数最后一位被截取导致计算rowIndex不正确
      rowIndex = parseInt((transfromY / props.rowHeight).toFixed(0));
    }
  }

  return {
    target,
    attributeValue,
    rowIndex
  };
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

// -------------------------------------------------------------
/**
 * when visual area Changed notice user
 * @param data
 */
const onViewPortChanged = (data: RowData[]) => {
  emit('viewPortChanged', data);
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