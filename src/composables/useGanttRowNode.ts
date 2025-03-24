import { ref, provide, onBeforeMount, shallowRef, watch } from 'vue';
import type { Ref } from 'vue';
import type GanttView from "@/components/ganttView/GanttView.vue";
import type TableView from "@/components/tableView/TableView.vue";

import type { RowData, GanttRowNode } from '@/types';
import dayjs from 'dayjs';
import { treeForEachSkipChildren } from "@/utils/common";

export const useGanttRowNode = ({
  ganttViewRef,
  tableViewRef,
  rows,
  getRowId,
  setExpand,
  setSelect,
  refreshCells,
  onViewPortChanged
}: {
  ganttViewRef: Ref<InstanceType<typeof GanttView>| undefined>,
  tableViewRef: Ref<InstanceType<typeof TableView>| undefined>,
  rows: Ref<RowData[], RowData[]>,
  getRowId: (row: RowData) => string,
  setExpand: (id: string, expand: boolean) => void,
  setSelect: (id: string) => void,
  refreshCells: (ids: string[], force?: boolean) => void,
  onViewPortChanged: (data: RowData[]) => void
}) => {

  const rowNodeMap = shallowRef(new Map<string, GanttRowNode>());
  const rowNodeIds = ref<string[]>([]); // every row's id，order is same as original row data
  const visibleRowIds = ref<string[]>([]); // exclude hidden row，order is same as original row data
  const rowDataList = shallowRef<RowData[]>([]); // include all row，order is same as original row data
  const firstLevelRowNode = shallowRef<GanttRowNode[]>([]); // the rows don't have parent，order is same as original row data

  onBeforeMount(() => {
    initRowNode();
  });

  watch(rows, (newRows, oldRows) => {
    console.log('rows change');
    onRowsChange(newRows, oldRows);
  }, { deep: false });

  /**
   * init rowNode, convert original row data to rowNode, include create and update rowNode
   */
  const initRowNode = () => {
    console.time('initRowNode');
    console.log('initRowNode');
    const oldRowNodeMap = rowNodeMap.value;
    const newRowNodeMap = new Map<string, GanttRowNode>();
    const newRowNodeIds: string[] = [];
    const newVisibleRowIds: string[] = [];
    const newRowDataList: RowData[] = [];
    const newFirstLevelRowNode: GanttRowNode[] = [];
    convertALLRows(rows.value, oldRowNodeMap, newRowNodeMap, newRowNodeIds, newRowDataList);
    rowNodeIds.value = newRowNodeIds;
    rowNodeMap.value = newRowNodeMap;
    rowDataList.value = newRowDataList;

    for (let rowId of newRowNodeIds) {
      const rowNode = newRowNodeMap.get(rowId);
      if (rowNode) {
        if (rowNode.expand) {
          newVisibleRowIds.push(rowId);
        }
        if (!rowNode.parentId) {
          newFirstLevelRowNode.push(rowNode);
        }
      }
    }
    visibleRowIds.value = newVisibleRowIds;
    firstLevelRowNode.value = newFirstLevelRowNode;
    console.log('newRowNodeMap', newRowNodeMap);
    console.timeEnd('initRowNode');
  };

  /**
   * a recursion function, collect row info for array and map etc.
   * @param rows
   * @param oldRowNodeMap
   * @param newRowNodeMap
   * @param newRowNodeIds
   * @param newRowDataList
   * @param level
   */
  const convertALLRows = (rows: RowData[], oldRowNodeMap: Map<string, GanttRowNode>, newRowNodeMap: Map<string, GanttRowNode>, newRowNodeIds: string[], newRowDataList: RowData[], level = 0) => {
    for (let row of rows) {
      const id = getRowId(row);
      newRowNodeIds.push(id);
      newRowDataList.push(row);
      if (row.children) {
        convertALLRows(row.children, oldRowNodeMap, newRowNodeMap, newRowNodeIds, newRowDataList, level + 1);
      }
      const newRowNode = oldRowNodeMap.get(id) || createRowNode(row, newRowNodeMap);
      updateRowNodeInfo(newRowNode, row, newRowNodeMap, level);
      newRowNodeMap.set(id, newRowNode);

    }
  };

  /**
   * convert original row data to rowNode
   * @param row
   * @param newRowNodeMap
   * @returns
   */
  const createRowNode = (row: RowData, newRowNodeMap: Map<string, GanttRowNode>) => {
    const startDateArr: dayjs.Dayjs[] = [];
    const endDateArr: dayjs.Dayjs[] = [];
    const hasChildren = row.children && row.children.length > 0;

    if (hasChildren) {
      for (let child of row.children!) {
        const id = getRowId(child);
        const childRowNode = newRowNodeMap.get(id);
        if (childRowNode) {
          childRowNode.startDate && startDateArr.push(childRowNode.startDate);
          childRowNode.endDate && endDateArr.push(childRowNode.endDate);
        }
      }
    } else if (row.timeLines) {
      for (let timeLine of row.timeLines) {
        startDateArr.push(dayjs(timeLine.startDate));
        endDateArr.push(dayjs(timeLine.endDate));
      }
    }

    const id = getRowId(row);

    const baseNode: GanttRowNode = {
      id,
      data: row,
      startDate: dayjs.min(startDateArr),
      endDate: dayjs.max(endDateArr),
      hasChildren: !!hasChildren,
      setExpand,
      setSelect,
      expand: true,
      level: 0
    };
    return baseNode;
  };

  /**
   * set RowNode's children and level in final
   * @param rowNode
   * @param row
   * @param newRowNodeMap
   * @param level
   */
  const updateRowNodeInfo = (rowNode: GanttRowNode, row: RowData, newRowNodeMap: Map<string, GanttRowNode>, level: number) => {
    const hasChildren = row.children && row.children.length > 0;
    const children: GanttRowNode[] = [];

    if (hasChildren) {
      for (let child of row.children!) {
        const id = getRowId(child);
        const childRowNode = newRowNodeMap.get(id);
        if (childRowNode) {
          children.push(childRowNode);
        }
      }
    }

    for (let child of children) {
      child.parentId = rowNode.id;
    }

    Object.assign(rowNode, {
      data: row,
      readOnly: hasChildren,
      hasChildren: !!hasChildren,
      children,
      level
    });
  };

  /**
   * update rowNode when row data change
   * @param newRows
   * @param oldRows
   */
  const onRowsChange = (newRows: RowData[], oldRows: RowData[]) => {
    const oldRowNodeMap = rowNodeMap.value;
    const newAddRowIds: string[] = [];
    treeForEachSkipChildren(newRows, (currentRow) => {
      const id = getRowId(currentRow);
      if (!oldRowNodeMap.has(id)) {
        newAddRowIds.push(id);
        return 'skipChildren';
      }
    });
    initRowNode();

    const newRowNodeMap = rowNodeMap.value;
    const newDeleteRowIds: string[] = [];
    treeForEachSkipChildren(oldRows, (currentRow) => {
      const id = getRowId(currentRow);
      if (!newRowNodeMap.has(id)) {
        newDeleteRowIds.push(id);
        return 'skipChildren';
      }
    });

    const topLevelRowNodeFromAdd: GanttRowNode[] = [];
    const topLevelRowNodeFromDelete: GanttRowNode[] = [];
    const topLevelRowNodeFromOldDelete: GanttRowNode[] = [];
    for (let rowId of newAddRowIds) {
      const topParentRowNode = getTopLevelRow(rowId, newRowNodeMap);
      topParentRowNode && topLevelRowNodeFromAdd.push(topParentRowNode);
    }

    for (let rowId of newDeleteRowIds) {
      const oldTopParentRowNode = getTopLevelRow(rowId, oldRowNodeMap);
      oldTopParentRowNode && topLevelRowNodeFromOldDelete.push(oldTopParentRowNode);

      const topParentRowNode = oldTopParentRowNode && newRowNodeMap.get(oldTopParentRowNode.id);
      if (topParentRowNode) {
        topLevelRowNodeFromDelete.push(topParentRowNode);
      }
    }

    // new rowNodes or new rowNodes will update date from top to bottom
    const needFreshTopNodes = topLevelRowNodeFromAdd.concat(topLevelRowNodeFromDelete);
    refreshRowNodeDate(needFreshTopNodes);

    // calculate ganttView's min startDate and max endDate
    ganttViewRef.value && ganttViewRef.value.updateMinAndMaxDateByChangeRowNode(
      { addedRowNodes: topLevelRowNodeFromAdd, deletedRowNodes: topLevelRowNodeFromOldDelete }, firstLevelRowNode.value);

    // fresh gantt time lines and table view
    const allNeedFreshCellNodes = getAllChildren(needFreshTopNodes);
    ganttViewRef.value && ganttViewRef.value.freshTimeLines(needFreshTopNodes);
    refreshCells(allNeedFreshCellNodes.map(item => item.id), true);

    // if row data is set in async, notice user
    const displayRows = getDisplayRows();
    if (displayRows) {
      onViewPortChanged(displayRows);
    }
  };

  const getTopLevelRow = (rowId: string, currentRowNodeMap: Map<string, GanttRowNode>) => {
    let currentRowNode = currentRowNodeMap.get(rowId);
    while (currentRowNode?.parentId) {
      currentRowNode = currentRowNodeMap.get(currentRowNode.parentId);
    }
    return currentRowNode;
  };

  provide(
    'getTopLevelRow',
    getTopLevelRow
  );

  /**
   * if user want to refresh row nodes data, call it
   */
  const freshRowNodes = (rows: RowData[]) => {
    const needUpdateTopRowNodes = new Set<GanttRowNode>();
    const rowIds = new Set<string>();
    for (let row of rows) {
      const startDateArr: dayjs.Dayjs[] = [];
      const endDateArr: dayjs.Dayjs[] = [];
      const id = getRowId(row);
      const currentRowNode = rowNodeMap.value.get(id);
      if (!currentRowNode) continue;

      rowIds.add(id);
      const hasChildren = currentRowNode.hasChildren;

      if (!hasChildren && row.timeLines) {
        for (let timeLine of row.timeLines) {
          startDateArr.push(dayjs(timeLine.startDate));
          endDateArr.push(dayjs(timeLine.endDate));
        }
        const oldStartDate = currentRowNode.startDate;
        const oldEndDate = currentRowNode.endDate;
        Object.assign(currentRowNode, {
          startDate: dayjs.min(startDateArr),
          endDate: dayjs.max(endDateArr),
          oldStartDate,
          oldEndDate
        });
        const topLevelRowNode = getTopLevelRow(currentRowNode.id, rowNodeMap.value);
        topLevelRowNode && needUpdateTopRowNodes.add(topLevelRowNode);
      }

    }

    const needUpdateTopRowNodeList = [...needUpdateTopRowNodes];
    refreshRowNodeDate(needUpdateTopRowNodeList);
    ganttViewRef.value && ganttViewRef.value.freshTimeLines(needUpdateTopRowNodeList);
    ganttViewRef.value && ganttViewRef.value.updateMinAndMaxDateByChangeRowNode({ updatedRowNodes: needUpdateTopRowNodeList }, firstLevelRowNode.value);
    refreshCells([...rowIds], true);
  };

  /**
   * a recursion function, fresh RowNodes' date
   * @param rowNodes
   */
  const refreshRowNodeDate = (rowNodes: GanttRowNode[]) => {
    for (let rowNode of rowNodes) {
      const startDateArr: dayjs.Dayjs[] = [];
      const endDateArr: dayjs.Dayjs[] = [];
      const hasChildren = rowNode.hasChildren;
      if (hasChildren) {
        const children = rowNode.children || [];
        refreshRowNodeDate(children);
        for (let child of children) {
          child.startDate && startDateArr.push(child.startDate);
          child.endDate && endDateArr.push(child.endDate);
        }
        const oldStartDate = rowNode.startDate;
        const oldEndDate = rowNode.endDate;
        Object.assign(rowNode, {
          startDate: dayjs.min(startDateArr),
          endDate: dayjs.max(endDateArr),
          oldStartDate,
          oldEndDate
        });
      }

    }
  };

  /**
   * update row node date when time line changed by move or stretch
   * @param rowId
   */
  const freshRowNodeDateByTimeLine = (rowId: string) => {
    const currentRowNode = rowNodeMap.value.get(rowId);
    const startDateArr: dayjs.Dayjs[] = [];
    const endDateArr: dayjs.Dayjs[] = [];

    if (currentRowNode?.timeLineNodes) {
      for (let timeLineNode of currentRowNode.timeLineNodes) {
        startDateArr.push(timeLineNode.startDate);
        endDateArr.push(timeLineNode.endDate);
      }
      const oldStartDate = currentRowNode.startDate;
      const oldEndDate = currentRowNode.endDate;
      Object.assign(currentRowNode, {
        startDate: dayjs.min(startDateArr),
        endDate: dayjs.max(endDateArr),
        oldStartDate,
        oldEndDate
      });
      refreshRowNodeDate([getTopLevelRow(rowId, rowNodeMap.value)!]);
    }
  };

  provide(
    'freshRowNodeDateByTimeLine',
    freshRowNodeDateByTimeLine
  );

  /**
   * get rowNode all children ,include children's children
   * @param rowNodes
   * @returns
   */
  const getAllChildren = (rowNodes: GanttRowNode[]) => {
    const result: GanttRowNode[] = [];
    treeForEachSkipChildren(rowNodes, (currentRowNode) => {
      result.push(currentRowNode);
    });

    return result;
  };

  /**
   * get data from rows which are showing in visual area
   * @returns
   */
  const getDisplayRows = () => {
    const firstRowIndex = tableViewRef.value?.getFirstDisplayedRow();
    const lastRowIndex = tableViewRef.value?.getLastDisplayedRow();

    if (firstRowIndex !== undefined && lastRowIndex !== undefined) {
      return rowDataList.value.slice(firstRowIndex, lastRowIndex + 1);
    } else {
      return null;
    }
  };

  const getRowNode = (id: string) => {
    return rowNodeMap.value.get(id);
  };

  const getRowNodeChildren = (parentId?: string) => {
    if (parentId) {
      return rowNodeMap.value.get(parentId)?.children || [];
    } else {
      return firstLevelRowNode.value;
    }
  };

  const getRowDataList = () => {
    return rowDataList.value;
  };

  return {
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
  };
};