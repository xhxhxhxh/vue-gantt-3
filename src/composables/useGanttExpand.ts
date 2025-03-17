import type { Ref, ShallowRef } from 'vue';
import type { GanttRowNode } from '@/types';
import type TableView from "@/components/tableView/TableView.vue";
import { treeForEachSkipChildren } from "@/utils/common";

export const useGanttExpand = ({
  tableViewRef,
  rowNodeMap,
  visibleRowIds,
  rowNodeIds,
  refreshCells,
  emitExpandChange
}: {
  tableViewRef: Ref<InstanceType<typeof TableView>| undefined>,
  rowNodeMap: ShallowRef<Map<string, GanttRowNode>, Map<string, GanttRowNode>>,
  visibleRowIds: Ref<string[], string[]>,
  rowNodeIds: Ref<string[], string[]>,
  refreshCells: (ids: string[], force?: boolean) => void,
  emitExpandChange: (ids: string[]) => void
}) => {
  const unExpandRowIds = new Set<string>(); // unExpand Row Ids collection, Row default expansion

  const handleSetExpand = (id: string, expand: boolean) => {
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
      emitExpandChange([...unExpandRowIds]);
      affectChildren.forEach(node => node.hide = !expand);
      visibleRowIds.value = newVisibleRowIds;
      currentRowNode.expand = expand;
      tableViewRef.value?.onFilterChanged();
      refreshCells([id], true);
    }
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
    emitExpandChange([...unExpandRowIds]);
  };

  /**
   * get row's children which are showing in gantt
   * @param rowNode
   * @returns
   */
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

  return {
    handleSetExpand,
    expandAll
  };
};