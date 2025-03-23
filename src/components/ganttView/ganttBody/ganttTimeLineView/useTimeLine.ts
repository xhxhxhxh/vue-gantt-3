import { inject, shallowRef } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import type { GanttRowNode, VisibleRow, TimeLineNode, TimeLine, TimePointNode, VisibleTimeLine } from '@/types';
import dayjs from 'dayjs';
import { treeForEach } from '@/utils/common';

export const useTimeLine = ({
  rowHeight,
  rowBuffer,
  perHourSpacing,
  scrollViewScrollTop,
  scrollViewScrollLeft,
  rowNodeMap,
  currentVisibleRowIds,
  startInfo,
  movingTimeLineRowId,
  movingTimeLine,
  createTimePointNodes
}: {
  rowHeight: number,
  rowBuffer: number,
  perHourSpacing: Ref<number>,
  scrollViewScrollTop: Ref<number>,
  scrollViewScrollLeft: Ref<number>,
  rowNodeMap: Map<string, GanttRowNode>,
  currentVisibleRowIds: Ref<string[], string[]>,
  startInfo: ComputedRef<{
    startDate: dayjs.Dayjs;
  }>,
  movingTimeLineRowId: Ref<string>,
  movingTimeLine: Ref<VisibleTimeLine | null>,
  createTimePointNodes: (timeLine: TimeLine) => TimePointNode[] | undefined
}) => {
  const wrapRef = inject('wrapRef') as Ref<HTMLDivElement | undefined>;
  const visibleRows = shallowRef<VisibleRow[]>([]);
  const visibleTimeLineMap = shallowRef<Map<string, VisibleTimeLine[]>>(new Map());
  const bufferWidth = 200;

  const freshTimeLineView = () => {
    freshVisibleRows();
    freshVisibleTimeLines();
  };

  const freshTimeLineViewAfterScrollTop = () => {
    freshVisibleRows();
    freshVisibleTimeLines(false);
  };

  const freshVisibleRows = () => {
    if (!wrapRef.value) return;
    console.log('freshVisibleRows');
    const wrapHeight = wrapRef.value.offsetHeight;
    const bufferHeight = rowHeight * rowBuffer;
    const startNumInView = Math.floor((scrollViewScrollTop.value - bufferHeight) / rowHeight);
    const endNumInView = Math.ceil((scrollViewScrollTop.value + wrapHeight + bufferHeight) / rowHeight);

    const newVisibleRows: VisibleRow[] = [];
    const start = Math.max(0, startNumInView);
    const end = Math.min(currentVisibleRowIds.value.length - 1, endNumInView);

    for (let i = start; i <= end; i++) {
      const currentRowId = currentVisibleRowIds.value[i];
      const currentRowNode = rowNodeMap.get(currentRowId);
      if (currentRowNode) {
        newVisibleRows.push({
          id: currentRowId,
          rowNode: currentRowNode,
          translateY: i * rowHeight
        });

        // 对timeLineNodes按照startdate先后进行排序，以方便timeline在画布中的位置计算
        const timeLineNodes = sortTimeLinesInRowNode(currentRowNode);

        if (timeLineNodes) {
          const timeLineNodesAfterCombine = mergeOverlapTimeLine(timeLineNodes);
          currentRowNode.timeLineNodes = timeLineNodesAfterCombine;
        }

      }

    }
    visibleRows.value = newVisibleRows;
  };

  const sortTimeLinesInRowNode = (rowNode: GanttRowNode) => {
    if (!rowNode.timeLineNodes && rowNode.data.timeLines) {
      const timeLineNodes:TimeLineNode[] = [];

      if (rowNode.hasChildren) {
        const timeLineNode = createTimeLineNodeFromRowNode(rowNode);
        timeLineNode && timeLineNodes.push(timeLineNode);
      } else {
        for (let timeLine of rowNode.data.timeLines) {
          const timeLineNode = createTimeLineNode(timeLine);
          timeLineNodes.push(timeLineNode);
        }
      }
      sortTimeLineNodes(timeLineNodes);
      return timeLineNodes;
    }
  };

  const createTimeLineNodeFromRowNode = (rowNode: GanttRowNode) => {
    const startDate = rowNode.startDate;
    const endDate = rowNode.endDate;
    const styleOption = { backgroundColor: '#000' };
    if (startDate && endDate) {
      const isSameDate = startDate.isSame(endDate);
      const baseNode: TimeLineNode = {
        id: rowNode.id,
        startDate,
        endDate,
        isSameDate,
        hasChildren: rowNode.hasChildren,
        styleOption
      };
      return baseNode;
    }
  };

  const sortTimeLineNodes = (timeLineNodes: TimeLineNode[]) => {
    timeLineNodes.sort((timeLine1, timeLine2) => {
      if (timeLine1.startDate.isSame(timeLine2.startDate)) return 0;
      if (timeLine1.startDate.isBefore(timeLine2.startDate)) {
        return -1;
      } else {
        return 1;
      }
    });
  };

  // 如果时间线之间有重叠区域需要将两个时间线合并
  const mergeOverlapTimeLine = (timeLineNodes: TimeLineNode[]) => {
    const newTimeLineNodes: TimeLineNode[] = [];
    for (let timeLineNode of timeLineNodes) {
      const lastTimeLineNode = newTimeLineNodes[newTimeLineNodes.length - 1];
      if (lastTimeLineNode && !timeLineNode.startDate.isAfter(lastTimeLineNode.endDate)) {
        lastTimeLineNode.isMerge = true;
        const maxEndDate = dayjs.max([lastTimeLineNode.endDate, timeLineNode.endDate]);
        maxEndDate && (lastTimeLineNode.endDate = maxEndDate);
        // 时间线中如果有时间点应该不支持合并
        // if (lastTimeLineNode.timePointNodes && timeLineNode.timePointNodes) {
        //   lastTimeLineNode.timePointNodes = lastTimeLineNode.timePointNodes.concat(timeLineNode.timePointNodes)
        // }

        if (!lastTimeLineNode.mergedTimeLineNodes) {
          lastTimeLineNode.mergedTimeLineNodes = [lastTimeLineNode];
        }
        if (timeLineNode.isMerge) {
          timeLineNode.isMerge = false;
          lastTimeLineNode.mergedTimeLineNodes = lastTimeLineNode.mergedTimeLineNodes.concat(timeLineNode.mergedTimeLineNodes!);
          timeLineNode.mergedTimeLineNodes = undefined;
        } else {
          lastTimeLineNode.mergedTimeLineNodes.push(timeLineNode);
        }
      } else {
        newTimeLineNodes.push(timeLineNode);
      }
    }
    return newTimeLineNodes;
  };

  const createTimeLineNode = (timeLine: TimeLine) => {
    const startDate = dayjs(timeLine.startDate);
    const endDate = dayjs(timeLine.endDate);
    const isSameDate = startDate.isSame(endDate);
    const styleOption = { ...timeLine.styleOption };

    if (isSameDate) {
      styleOption.backgroundColor = '#000';
    }

    const timePointNodes = createTimePointNodes(timeLine);
    const baseNode: TimeLineNode = {
      id: timeLine.id,
      timePointNodes,
      startDate,
      endDate,
      isSameDate,
      styleOption,
      icon: timeLine.icon,
      label: timeLine.label,
    };
    return baseNode;
  };

  const freshVisibleTimeLines = (freshAll = true) => {
    if (!wrapRef.value) return;
    const wrapWidth = wrapRef.value.offsetWidth;
    const { startDate } = startInfo.value;
    const startLeftInView = scrollViewScrollLeft.value - bufferWidth;
    const endLeftInView = scrollViewScrollLeft.value + wrapWidth + bufferWidth;

    const startDateInView = startDate.add(Math.max(0, startLeftInView) / perHourSpacing.value, 'hour');
    const endDateInView = startDate.add(endLeftInView / perHourSpacing.value, 'hour');

    const newVisibleTimeLineMap: Map<string, VisibleTimeLine[]> = new Map();

    let needFreshRows: VisibleRow[] = [];
    if (freshAll) {
      needFreshRows = visibleRows.value;
    } else {
      needFreshRows = visibleRows.value.filter(row => {
        const oldTimeLineCache = visibleTimeLineMap.value.get(row.id);
        if (oldTimeLineCache) {
          newVisibleTimeLineMap.set(row.id, oldTimeLineCache);
        }
        return !oldTimeLineCache;
      });
    }
    for (let visibleRow of needFreshRows) {
      const rowId = visibleRow.id;
      const timeLineNodes = visibleRow.rowNode.timeLineNodes;
      if (timeLineNodes) {
        const visibleTimeLines: VisibleTimeLine[] = [];
        const startIndex = getTimeLineIndexInView(timeLineNodes, startDateInView, 'min');
        const endIndex = getTimeLineIndexInView(timeLineNodes, endDateInView, 'max');
        const hasMovingTimeLine = movingTimeLineRowId.value === rowId;
        for (let i = startIndex; i < endIndex; i++) {
          const currentTimeNode = timeLineNodes[i];

          if (hasMovingTimeLine && currentTimeNode.id === movingTimeLine.value?.id) continue;

          const currentStartDate = currentTimeNode.startDate;
          const currentEndDate = currentTimeNode.endDate;
          const translateX = currentStartDate.diff(startDate, 'hour', true) * perHourSpacing.value;
          const width = currentTimeNode.isSameDate ? 0 : currentEndDate.diff(currentStartDate, 'hour', true) * perHourSpacing.value;
          let type: 'parentTimeLineNode' | 'sameDateTimeLineNode' | 'normal' = 'normal';

          if (currentTimeNode.hasChildren) {
            type = 'parentTimeLineNode';
          } else if (currentTimeNode.isSameDate) {
            type = 'sameDateTimeLineNode';
          }

          const originalTimePoints = currentTimeNode.timePointNodes || [];
          const timePointNodes: TimePointNode[] = [];

          for (let timePointNode of originalTimePoints) {
            if (timePointNode.date.isBetween(currentStartDate, currentEndDate, undefined, '[]')) {
              const timePointNodeTranslateX = timePointNode.date.diff(currentStartDate, 'hour', true) * perHourSpacing.value;
              timePointNode.translateX = timePointNodeTranslateX;
              timePointNodes.push(timePointNode);
            }
          }

          visibleTimeLines.push({
            id: currentTimeNode.id,
            startDate: currentTimeNode.startDate,
            endDate: currentTimeNode.endDate,
            timeLineNode: currentTimeNode,
            width,
            translateX,
            styleOption: currentTimeNode.styleOption,
            type,
            timePointNodes,
            icon: currentTimeNode.icon,
            label: currentTimeNode.label,
          });
        }
        if (hasMovingTimeLine) {
          visibleTimeLines.push(movingTimeLine.value!);
        }
        newVisibleTimeLineMap.set(rowId, visibleTimeLines);
      }
    }
    visibleTimeLineMap.value = newVisibleTimeLineMap;
  };

  // 查找显示区域内时间线的索引(二分法),timeLineNodes经过排序和合并，每个node的开始时间必然不相同
  const getTimeLineIndexInView = (timeLineNodes: TimeLineNode[], targetDate: dayjs.Dayjs, type: 'min' | 'max') => {
    let minIndex = 0;
    let maxIndex = timeLineNodes.length - 1;

    while (maxIndex >= minIndex) {
      const midIndex = Math.floor((minIndex + maxIndex) / 2);
      const startDate = timeLineNodes[midIndex].startDate;
      const endDate = timeLineNodes[midIndex].endDate;
      const currentDate = type === 'min' ? endDate : startDate;
      if (currentDate.isBefore(targetDate)) {
        minIndex = midIndex + 1;
      } else {
        maxIndex = midIndex - 1;
      }
    }
    return minIndex;
  };

  const freshTimeLines = (rowNodes: GanttRowNode[]) => {
    if (rowNodes.length === 0) return;
    treeForEach(rowNodes, (rowNode) => {
      const currentRowId = rowNode.id;
      const currentRowNode = rowNodeMap.get(currentRowId);
      currentRowNode && (currentRowNode.timeLineNodes = undefined);
      visibleTimeLineMap.value.delete(currentRowId);
    });
    freshTimeLineViewAfterScrollTop();
  };

  const updateParentTimeLine = (rowId: string) => {
    const parentRowNode = rowNodeMap.get(rowId);
    const { startDate } = startInfo.value;
    if (parentRowNode) {
      const parentTimeLineNode = parentRowNode.timeLineNodes?.[0];
      const parentVisibleTimeLine = visibleTimeLineMap.value.get(rowId)?.[0];
      if (parentTimeLineNode) {
        const childrenRowNodes = parentRowNode.children || [];
        const startDateArr: dayjs.Dayjs[] = [];
        const endDateArr: dayjs.Dayjs[] = [];
        for (let childRowNode of childrenRowNodes) {
          const childTimeLineNodes = childRowNode.timeLineNodes || [];
          for (let childTimeLineNode of childTimeLineNodes) {
            startDateArr.push(childTimeLineNode.startDate);
            endDateArr.push(childTimeLineNode.endDate);
          }
          const minStartDate = dayjs.min(startDateArr);
          const maxEndDate = dayjs.max(endDateArr);
          if (minStartDate && maxEndDate) {
            parentTimeLineNode.startDate = minStartDate;
            parentTimeLineNode.endDate = maxEndDate;
            if (parentVisibleTimeLine) {
              const translateX = parentTimeLineNode.startDate.diff(startDate, 'hour', true) * perHourSpacing.value;
              const width = parentTimeLineNode.endDate.diff(parentTimeLineNode.startDate, 'hour', true) * perHourSpacing.value;
              parentVisibleTimeLine.translateX = translateX;
              parentVisibleTimeLine.width = width;
            }
          }

        }
        parentRowNode.parentId && updateParentTimeLine(parentRowNode.parentId);
      }
    }
  };

  return {
    freshTimeLineView,
    freshTimeLineViewAfterScrollTop,
    freshTimeLines,
    freshVisibleTimeLines,
    sortTimeLineNodes,
    mergeOverlapTimeLine,
    visibleTimeLineMap,
    visibleRows,
    updateParentTimeLine
  };
};