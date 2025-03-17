import { ref, provide, onMounted, onBeforeUnmount, watch } from 'vue';
import type { Ref } from 'vue';

export const useGanttSelect = ({
  vGanttRef,
  visibleRowIds,
  rowHeight,
  rowClass,
  emitGanttMouseDown,
  emitSelectChange
}: {
  vGanttRef: Ref<HTMLDivElement | undefined>,
  visibleRowIds: Ref<string[], string[]>,
  rowHeight: number,
  rowClass: string,
  emitGanttMouseDown: (event: MouseEvent, rowId: string | null) => void,
  emitSelectChange: (ids: string[]) => void
}) => {
  const selectedRowIds = ref<Set<string>>(new Set());
  let lastMouseMoveTarget: HTMLElement | null = null;
  let lastClickedRowId = '';
  let lastClickedRowIndex = 0;

  provide(
    'selectedRowIds',
    selectedRowIds
  );

  watch(selectedRowIds, (val) => {
    emitSelectChange([...val]);
  }, { deep: true });

  onMounted(() => {
    vGanttRef.value?.addEventListener('mousedown', handleGanttMouseDown);
  });

  onBeforeUnmount(() => {
    vGanttRef.value?.removeEventListener('mousedown', handleGanttMouseDown);
  });

  function handleGanttMouseDown (this: HTMLElement, event: MouseEvent) {
    const { target, attributeValue: rowId, rowIndex } = getTargetElementInfo(event.target as HTMLElement | null, rowClass, 'data-row-id');
    emitGanttMouseDown(event, rowId);
    if (target) {
      const isLeftMouse = event.button === 0;
      if (rowId) {
        handleRowSelect(rowId, event, rowIndex);
      } else {
        // click empty table view row to clear select
        selectedRowIds.value.clear();
        return;
      }
      if (isLeftMouse) {
        this.addEventListener('mousemove', handleGanttMouseMove);
        document.addEventListener('mouseup', handleGanttMouseUp);
      }
    } else {
      // click empty gantt view row to clear select
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

  /**
   * select function core, support multi select by using ctrl and shift
   * @param rowId
   * @param event
   * @param rowIndex
   * @param onShift
   * @returns
   */
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

    // handle shift
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

  /**
   * get target dom attribute and row index
   * @param initialTarget
   * @param targetClass
   * @param attribute
   * @returns
   */
  const getTargetElementInfo = (initialTarget: HTMLElement | null, targetClass: string, attribute?: string) => {
    let target = initialTarget;
    let attributeValue: string | null = '';
    let rowIndex = 0;
    while (target && !target.classList.contains(targetClass)) {
      target = target?.parentElement;
    }

    // calculate row index by transformY / rowHeight
    if (target && attribute) {
      attributeValue = target.getAttribute(attribute);
      const transform = target.style.transform;
      const transformYStr = transform.match(/translateY\((.+)px\)/)?.[1];
      if (transformYStr) {
        const transformY = parseFloat(transformYStr);
        // Rounding is required here to prevent the last bit of the browser's scientific count from being intercepted
        // when the value is too large, resulting in incorrect calculation of the rowIndex
        rowIndex = parseInt((transformY / rowHeight).toFixed(0));
      }
    }

    return {
      target,
      attributeValue,
      rowIndex
    };
  };

  const handleSetSelect = (id: string) => {
    selectedRowIds.value.clear();
    selectedRowIds.value.add(id);
  };

  const selectRows = (ids: string[]) => {
    selectedRowIds.value = new Set(ids);
  };

  return {
    handleSetSelect,
    selectRows,
    getTargetElementInfo,
  };
};