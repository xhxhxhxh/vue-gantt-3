<template>
  <div ref="leftTableRef" class="vg-left-table">
    <div v-show="showSecondLevel" class="first-level-header" :style="{height: headerHeight + 1 + 'px'}"></div>
    <ag-grid-vue
      class="ag-theme-alpine ag-theme-mgantttheme"
      :gridOptions="gridOptions"
      :getRowId="getTableRowId"
      :columnDefs="columnDefs"
      :rowData="rowData"
      :defaultColDef="defaultCol"
      :rowHeight="rowHeight"
      :headerHeight="headerHeight"
      :rowBuffer="rowBuffer"
      :suppressNoRowsOverlay="true"
      :rowSelection="rowSelection"
      :alwaysShowHorizontalScroll="true"
      :suppressRowHoverHighlight="true"
      :suppressCellFocus="true"
      :suppressRowClickSelection="true"
      :processRowPostCreate="processRowPostCreate"
      :domLayout="domLayout"
      @grid-ready="onGridReady"
      @viewport-changed="onViewPortChanged"
      @cell-double-clicked="onCellDoubleClicked"
      @selection-changed="onSelectionChanged"
      @cell-context-menu="onCellContextMenu"
    >
    </ag-grid-vue>
  </div>
</template>
<script lang="ts" setup>
import { AgGridVue } from "ag-grid-vue3";
import type { GridApi, IRowNode, GridReadyEvent, ViewportChangedEvent, CellDoubleClickedEvent,
  SelectionChangedEvent, CellContextMenuEvent, ProcessRowParams, ILoadingCellRendererParams } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { toRef, ref, shallowRef, inject, watch, onMounted, onBeforeUnmount, onBeforeMount, markRaw, nextTick } from 'vue';
import type { Ref } from 'vue';
import type { RowData, ColumnData, DefaultCol, ColumnNode, FirstColumnCellRenderParams, GanttRowNode } from '@/types';
import FirstColumnCellRender from "./FirstColumnCellRender.vue";

export interface Props {
  getRowId: (rowData: RowData) => string,
  columns: ColumnData[],
  rows: RowData[],
  rowNodeMap: Map<string, GanttRowNode>,
  defaultCol?: DefaultCol,
  rowHeight: number,
  headerHeight: number,
  rowBuffer: number,
  rowSelection: 'single' | 'multiple',
  getEmptyRows?: (count: number) => RowData[],

}
console.log('leftTable');

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'viewPortChanged', data: RowData[]): void,
  (e: 'cellDoubleClicked', rowData: RowData | undefined, columnData?: ColumnData): void,
  (e: 'selectionChanged', data: SelectionChangedEvent<RowData>): void,
  (e: 'cellContextMenu', data: CellContextMenuEvent<RowData>): void,
  (e: 'triggerRightGanttScroll', options: ScrollToOptions): void,
}>();

const leftTableRef = ref<HTMLDivElement>();
const columns = toRef(props, 'columns');
const columnDefs = shallowRef<ColumnNode[]>([]);
const visibleRowDataList = toRef(props, 'rows');
const rowData = shallowRef<RowData[]>([]);
const emptyRows = shallowRef<RowData[]>([]);
const tableRef = ref<GridApi<RowData>>();
const tableBodyView = ref<HTMLDivElement | null>(null);
const tableBodyVerticalScrollViewport = ref<HTMLDivElement | null>(null);
const scrollFromRightGantt = ref(false);
const selectedRowIds = inject('selectedRowIds') as Ref<Set<string>>;
const firstColumnCellRenderComp = markRaw(FirstColumnCellRender);
const showSecondLevel = inject('showSecondLevel') as Ref<boolean>;
let firstColumId = '';
let scrollFromTableBody = false;
let cacheLastRowId = '';
let cacheLastRowDom: HTMLDivElement | null = null;
const domLayout = ref('normal');

const gridOptions = {
  rowClass: 'vg-row',
  doesExternalFilterPass,
  isExternalFilterPresent,
};

onBeforeMount(() => {
  formatColumnDefs(columns.value);
  getRows();
}),

onBeforeUnmount(() => {
  tableBodyView.value?.removeEventListener('wheel', bodyWheel);
  tableBodyVerticalScrollViewport.value?.removeEventListener('scroll', verticalScrollViewportScroll);
});

watch(columns, (val) => {
  formatColumnDefs(val);
});

watch(visibleRowDataList, () => {
  const hasChange = handleEmptyRowChanged();
  if (!hasChange) {
    getRows();
  }
}, { deep: false });

watch(emptyRows, () => {
  getRows();
}, { deep: false });

const onGridReady = (params: GridReadyEvent<RowData>) => {
  tableRef.value = params.api;
  tableBodyView.value = leftTableRef.value!.querySelector('.ag-body-viewport');
  tableBodyView.value?.addEventListener('wheel', bodyWheel, { passive: false });
  tableBodyVerticalScrollViewport.value = leftTableRef.value!.querySelector('.ag-body-vertical-scroll-viewport');
  tableBodyVerticalScrollViewport.value?.addEventListener('scroll', verticalScrollViewportScroll);
  console.log('tableRef.value', tableRef.value);
};

const getRows = () => {
  console.log('getRows');
  rowData.value = visibleRowDataList.value.concat(emptyRows.value);
  nextTick(setTableRowSelected);
};

const getTableRowId = (params: IRowNode<RowData>) => {
  if (params.data) {
    return props.getRowId(params.data);
  } else {
    return '';
  }
};

function formatColumnDefs (columnDatas: ColumnData[]) {
  firstColumId = columnDatas[0]?.field || '';
  const newColumnDefs: ColumnNode[] = [];
  for (let columnData of columnDatas) {
    const newColumnData: ColumnNode = { ...columnData };
    newColumnData.cellRendererSelector = cellRendererSelector;
    newColumnDefs.push(newColumnData);
  }
  columnDefs.value = newColumnDefs;
}

function cellRendererSelector (params: ILoadingCellRendererParams<RowData>) {
  const field = params.colDef?.field;
  const cellRendererParams = params.colDef?.cellRendererParams;
  if (firstColumId && field === firstColumId && cellRendererParams?.expandable) {
    return {
      component: firstColumnCellRenderComp,
      params: {
        ...cellRendererParams,
        component: params.colDef?.cellRenderer,
        rowNode: getRowNode(params.data)
      } as FirstColumnCellRenderParams
    };
  }
  return undefined;
}

const getRowNode = (row?: RowData) => {
  let rowNode: GanttRowNode | undefined;
  if (row) {
    const id = props.getRowId(row);
    rowNode = props.rowNodeMap.get(id);
  }
  return rowNode;
};

const handleScroll = (options: ScrollToOptions) => {
  if (scrollFromRightGantt.value) {
    scrollFromRightGantt.value = false;
  } else {
    emit('triggerRightGanttScroll', options);
  }
};

const verticalScrollViewportScroll = () => {
  if (scrollFromTableBody) {
    scrollFromTableBody = false;
    return;
  }
  handleScroll({ top: tableBodyVerticalScrollViewport.value?.scrollTop });
};

// 为了与右侧甘特图保持滚动一致，拦截滚轮事件，触发verticalScrollViewport元素滚动，缺点是会直接滚动到指定位置，看不到中间的滚动过程
const bodyWheel = (e: WheelEvent) => {
  e.preventDefault();
  if (!tableBodyVerticalScrollViewport.value) return;
  if (Math.abs(e.deltaY) < 3) return;
  scrollFromRightGantt.value = false;
  const scrollSpeed = 100;
  const scrollDistance = e.deltaY > 0 ? scrollSpeed : -scrollSpeed;
  const scrollTop = tableBodyVerticalScrollViewport.value?.scrollTop + scrollDistance;
  tableBodyVerticalScrollViewport.value?.scrollTo({ top: scrollTop });
};

watch(selectedRowIds, () => {
  setTableRowSelected();
}, { deep: true });

const setTableRowSelected = () => {
  tableRef.value?.deselectAll();
  const rowNodes: IRowNode<RowData>[] = [];
  const rowIds = [...selectedRowIds.value];
  rowIds.forEach(id => {
    const rowNode = tableRef.value?.getRowNode(id);
    rowNode && rowNodes.push(rowNode);
  });
  tableRef.value?.setNodesSelected({ nodes: rowNodes, newValue: true });
};

const onViewPortChanged = (data: ViewportChangedEvent<RowData>) => {
  // console.log('data', data);
  const firstRow = data.firstRow;
  const lastRow = data.lastRow;

  emit('viewPortChanged', visibleRowDataList.value.slice(firstRow, lastRow + 1));
};

const handleEmptyRowChanged = (target?: HTMLDivElement) => {
  const { getEmptyRows, rowHeight, getRowId } = props;
  let hasChange = false;
  if (getEmptyRows && tableRef.value && tableBodyView.value) {
    const bodyHeight = target?.offsetHeight || tableBodyView.value.offsetHeight;
    const limitCount = Math.ceil(bodyHeight / rowHeight);
    const displayedRowCount = getVisibleRowCount(limitCount);
    const emptyRowCount = limitCount - displayedRowCount;
    let newEmptyRows: RowData[] = [];
    const lastEmptyRowCount = emptyRows.value.length;
    if (emptyRowCount !== lastEmptyRowCount) {
      console.log('handleEmptyRowChanged');

      const verticalScroll = tableBodyVerticalScrollViewport.value?.parentElement;
      if (verticalScroll) {
        if (emptyRowCount > 0) {
          domLayout.value = 'autoHeight';
        } else {
          domLayout.value = 'normal';
        }
      }
      newEmptyRows = getEmptyRows(emptyRowCount);
      newEmptyRows.forEach(item => item.isEmpty = true);
      emptyRows.value = newEmptyRows;
      hasChange = true;
    }
    if (emptyRowCount > 0) {
      console.log('33333');
      if (lastEmptyRowCount > 0 && emptyRowCount > lastEmptyRowCount) {
        const resetRowData = emptyRows.value[lastEmptyRowCount - 1];
        const resetRowNode = tableRef.value?.getRowNode(getRowId(resetRowData));
        resetRowNode?.setRowHeight(rowHeight);
      }
      nextTick(() => {
        const diffHeight = limitCount * rowHeight - bodyHeight;
        const lastRowData = emptyRows.value[emptyRowCount - 1];
        const lastRowId = getRowId(lastRowData);
        const lastRowNode = tableRef.value?.getRowNode(lastRowId);
        lastRowNode?.setRowHeight(rowHeight - diffHeight);
        const lastRowDom = cacheLastRowId === lastRowId ? cacheLastRowDom : tableBodyView.value!.querySelector(`.${gridOptions.rowClass}[row-id="${lastRowId}"]`) as HTMLDivElement;
        if (cacheLastRowId !== lastRowId) {
          cacheLastRowId = lastRowId;
          cacheLastRowDom = lastRowDom;
        }
        if (diffHeight === 0) {
          lastRowDom && (lastRowDom.classList.remove('no-bottom-border-row'));
        } else {
          lastRowDom && (lastRowDom.classList.add('no-bottom-border-row'));
        }
        tableRef.value?.onRowHeightChanged();
      });

    }
  }
  return hasChange;

};

const getVisibleRowCount = (limitCount: number) => {
  let count = 0;
  for (let visibleRowData of visibleRowDataList.value) {
    if (count >= limitCount) break;
    const rowNode = getRowNode(visibleRowData);
    rowNode && !rowNode.hide && count++;
  }
  return count;
};

const onCellDoubleClicked = (data: CellDoubleClickedEvent<RowData>) => {
  emit('cellDoubleClicked', data.data, data.colDef as ColumnData);
};

const onSelectionChanged = (data: SelectionChangedEvent<RowData>) => {
  emit('selectionChanged', data);
};

const onCellContextMenu = (data: CellContextMenuEvent<RowData>) => {
  emit('cellContextMenu', data);
};

const processRowPostCreate = (data: ProcessRowParams<RowData>) => {
  if (!data.node.data?.isEmpty) {
    data.eRow.setAttribute('data-row-id', data.node.id as string);
  }
};

function isExternalFilterPresent () {
  return true;
}

function doesExternalFilterPass (node: IRowNode<RowData>) {
  const currentRowNode = getRowNode(node.data);
  return !currentRowNode?.hide;
}

const onFilterChanged = () => {
  handleEmptyRowChanged();
  tableRef.value?.onFilterChanged();
};

const scrollTo = (options: ScrollToOptions, triggerScrollBar?: boolean) => {
  scrollFromRightGantt.value = true;
  if (triggerScrollBar) {
    tableBodyVerticalScrollViewport.value?.scrollTo(options);
  } else {
    scrollFromTableBody = true;
    tableBodyView.value?.scrollTo(options);
    // 当新的options值与现有滚动条位置一致时，不会再次触发scroll事件，需要手动将scrollFromTableBody设为false
    if (tableBodyVerticalScrollViewport.value?.scrollTop === options.top) {
      scrollFromTableBody = false;
    }
  }
};

const refreshCells = (rowIds: string[], force = false) => {
  const rowNodes: IRowNode<RowData>[] = [];
  rowIds.forEach(id => {
    const rowNode = tableRef.value?.getRowNode(id);
    rowNode && rowNodes.push(rowNode);
  });
  if (rowNodes.length) {
    console.log('refreshCells');
    tableRef.value?.refreshCells({ rowNodes: rowNodes, force });
  }

};

const getFirstDisplayedRow = () => {
  return tableRef.value?.getFirstDisplayedRow();
};

const getLastDisplayedRow = () => {
  return tableRef.value?.getLastDisplayedRow();
};

defineExpose({
  scrollTo,
  refreshCells,
  onFilterChanged,
  handleEmptyRowChanged,
  getFirstDisplayedRow,
  getLastDisplayedRow
});

</script>
<style lang="scss">
.vg-left-table {
  height: 100%;
  display: flex;
  flex-direction: column;
  .first-level-header {
    background: #F3F3F4;
    border-bottom: 1px solid #D0D0D0;
  }
  .ag-theme-mgantttheme {
    flex: 1;
    height: 100%;
    overflow: hidden;
    --ag-borders: none,
    --ag-odd-row-background-color: #fff;
    --ag-border-color: #e9e9e9;
    --ag-row-border-color: #e9e9e9;
    --ag-cell-horizontal-border: 1px solid #e9e9e9;
    --ag-header-column-resize-handle-height: 100%;
    --ag-header-column-resize-handle-width: 1px;
    --ag-header-column-resize-handle-color: #e9e9e9;
    --ag-header-background-color: #fff;
    --ag-cell-horizontal-padding: 9px;
    --ag-selected-row-background-color: #747AD0;
    --ag-odd-row-background-color: #fff;
    .ag-row {
      .ag-cell:last-of-type {
        // --ag-cell-horizontal-border: 1px solid transparent;
      }
    }
    .ag-header {
      --ag-borders-critical: 1px solid;
    }
    .ag-row-last.no-bottom-border-row {
      border-bottom: 0;
    }
    .ag-header-row {
      .ag-header-cell:last-of-type {

      }
    }
  }
}
</style>