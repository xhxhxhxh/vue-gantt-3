import { toRef, shallowRef, onBeforeMount, watch, markRaw } from 'vue';
import type { ColumnNode, ColDef, RowData, FirstColumnCellRenderParams, GanttRowNode } from '@/types';
import type { ILoadingCellRendererParams } from "ag-grid-community";
import FirstColumnCellRender from "./FirstColumnCellRender.vue";

export const useTableColumns = ({
  props,
  getRowNode

}: {
  props: any,
  getRowNode: (row?: RowData) => GanttRowNode | undefined
}) => {
  const columns = toRef(props, 'columns');
  const firstColumnCellRenderComp = markRaw(FirstColumnCellRender);

  const columnDefs = shallowRef<ColumnNode[]>([]);
  let firstColumId = '';

  watch(columns, (val) => {
    formatColumnDefs(val);
  });

  onBeforeMount(() => {
    formatColumnDefs(columns.value);
  });

  function formatColumnDefs (columnDatas: ColDef[]) {
    firstColumId = columnDatas[0]?.field || '';
    const newColumnDefs: ColumnNode[] = [];
    for (let columnData of columnDatas) {
      const newColumnData: ColumnNode = { ...columnData };
      newColumnData.cellRendererSelector = cellRendererSelector;
      newColumnDefs.push(newColumnData);
    }
    columnDefs.value = newColumnDefs;
  }

  /**
   * a cell renderer to show expand icon
   * @param params
   * @returns
   */
  function cellRendererSelector (params: ILoadingCellRendererParams<Omit<RowData, 'children'>>) {
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

  return {
    columnDefs
  };
};