<template>
  <div ref="tableViewRef" class="vg-table-view">
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
  SelectionChangedEvent, CellContextMenuEvent, ProcessRowParams } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ref, inject, watch } from 'vue';
import type { Ref } from 'vue';
import type { RowData, ColDef, DefaultColDef, GanttRowNode } from '@/types';
import { useTableColumns } from './useTableColumn';
import { useTableRow } from './useTableRow';
import { useTableScroll } from './useTableScroll';

export interface Props {
  getRowId: (rowData: RowData) => string,
  columns: ColDef[],
  rows: RowData[],
  rowNodeMap: Map<string, GanttRowNode>,
  defaultCol?: DefaultColDef,
  rowHeight: number,
  headerHeight: number,
  rowBuffer: number,
  rowSelection: 'single' | 'multiple',
  getEmptyRows?: (count: number) => RowData[],

}
console.log('tableView');

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'viewPortChanged', data: RowData[]): void,
  (e: 'cellDoubleClicked', rowData: RowData | undefined, columnData?: ColDef): void,
  (e: 'selectionChanged', data: SelectionChangedEvent<RowData>): void,
  (e: 'cellContextMenu', data: CellContextMenuEvent<RowData>): void,
  (e: 'triggerGanttViewScroll', options: ScrollToOptions): void,
}>();

const tableViewRef = ref<HTMLDivElement>();
const tableRef = ref<GridApi<RowData>>();
const tableBodyView = ref<HTMLDivElement | null>(null);
const tableBodyVerticalScrollViewport = ref<HTMLDivElement | null>(null);
const selectedRowIds = inject('selectedRowIds') as Ref<Set<string>>;
const showSecondLevel = inject('showSecondLevel') as Ref<boolean>;
const domLayout = ref('normal');

const gridOptions = {
  rowClass: 'vg-row',
  doesExternalFilterPass,
  isExternalFilterPresent,
};

const onGridReady = (params: GridReadyEvent<RowData>) => {
  tableRef.value = params.api;
  tableBodyView.value = tableViewRef.value!.querySelector('.ag-body-viewport');
  tableBodyView.value?.addEventListener('wheel', bodyWheel, { passive: false });
  tableBodyVerticalScrollViewport.value = tableViewRef.value!.querySelector('.ag-body-vertical-scroll-viewport');
  tableBodyVerticalScrollViewport.value?.addEventListener('scroll', verticalScrollViewportScroll);
};

const emitTriggerGanttViewScroll = (options: ScrollToOptions) => {
  emit('triggerGanttViewScroll', options);
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

const onCellDoubleClicked = (data: CellDoubleClickedEvent<RowData>) => {
  emit('cellDoubleClicked', data.data, data.colDef as ColDef);
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

const refreshCells = (rowIds: string[], force = false) => {
  const rowNodes: IRowNode<RowData>[] = [];
  rowIds.forEach(id => {
    const rowNode = tableRef.value?.getRowNode(id);
    rowNode && rowNodes.push(rowNode);
  });
  if (rowNodes.length) {
    tableRef.value?.refreshCells({ rowNodes: rowNodes, force });
  }

};

const getFirstDisplayedRow = () => {
  return tableRef.value?.getFirstDisplayedRow();
};

const getLastDisplayedRow = () => {
  return tableRef.value?.getLastDisplayedRow();
};

const {
  rowData,
  getTableRowId,
  getRowNode,
  handleEmptyRowChanged,
  visibleRowDataList
} = useTableRow({
  props,
  setTableRowSelected,
  rowClass: gridOptions.rowClass,
  tableRef,
  tableBodyView,
  tableBodyVerticalScrollViewport
});

const { columnDefs } = useTableColumns({ props, getRowNode });

const {
  scrollTo,
  bodyWheel,
  verticalScrollViewportScroll
} = useTableScroll({
  tableBodyView,
  tableBodyVerticalScrollViewport,
  emitTriggerGanttViewScroll
});

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
.vg-table-view {
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