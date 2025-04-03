import { toRef, shallowRef, onBeforeMount, watch, nextTick, ref } from 'vue';
import type { Ref } from 'vue';
import type { RowData, GanttRowNode } from '@/types';
import type { IRowNode, GridApi } from "ag-grid-community";

export const useTableRow = ({
  props,
  setTableRowSelected,
  rowClass,
  tableRef,
  tableBodyView,
  tableBodyVerticalScrollViewport
}: {
  props: any,
  setTableRowSelected: () => void,
  rowClass: string,
  tableRef: Ref<GridApi<RowData> | undefined>,
  tableBodyView: Ref<HTMLDivElement | null>,
  tableBodyVerticalScrollViewport: Ref<HTMLDivElement | null>,
}) => {
  const visibleRowDataList = toRef(props, 'rows');
  const rowData = shallowRef<RowData[]>([]);
  const emptyRows = shallowRef<RowData[]>([]);
  const domLayout = ref('normal');
  let cacheLastRowId = '';
  let cacheLastRowDom: HTMLDivElement | null = null;

  onBeforeMount(() => {
    getRows();
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

  /**
   * rows also include empty rows
   */
  const getRows = () => {
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

  const getRowNode = (row?: RowData) => {
    let rowNode: GanttRowNode | undefined;
    if (row) {
      const id = props.getRowId(row);
      rowNode = props.rowNodeMap.get(id);
    }
    return rowNode;
  };

  /**
   * according Empty Row count to change domLayout, make table and gantt view align
   * @param target
   * @returns
   */
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
          const lastRowDom = cacheLastRowId === lastRowId ? cacheLastRowDom : tableBodyView.value!.querySelector(`.${rowClass}[row-id="${lastRowId}"]`) as HTMLDivElement;
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

  return {
    rowData,
    getTableRowId,
    getRowNode,
    handleEmptyRowChanged,
    visibleRowDataList
  };
};