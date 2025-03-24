import { inject, triggerRef } from 'vue';
import type { Ref, ShallowRef } from 'vue';
import type { GanttRowNode, VisibleTimeLine, TimeLineNode, MovedTimeLineData } from '@/types';
import dayjs from 'dayjs';
import { getRound } from '@/utils/common';

export const useTimeLineMove = ({
  edgeSpacing,
  ganttViewWidth,
  rowNodeMap,
  movingTimeLineRowId,
  movingTimeLine,
  timeLineMoving,
  visibleTimeLineMap,
  closeEdgeScroll,
  sortTimeLineNodes,
  mergeOverlapTimeLine,
  freshVisibleTimeLines,
  getDiffSecondByDistance,
  emitUpdateMinDate,
  emitUpdateMaxDate,
  updateParentTimeLine
}: {
  edgeSpacing: number,
  ganttViewWidth: Ref<number>,
  rowNodeMap: Ref<Map<string, GanttRowNode>, Map<string, GanttRowNode>>,
  movingTimeLineRowId: Ref<string>,
  movingTimeLine: Ref<VisibleTimeLine | null>,
  timeLineMoving: Ref<boolean>,
  visibleTimeLineMap: ShallowRef<Map<string, VisibleTimeLine[]>, Map<string, VisibleTimeLine[]>>,
  closeEdgeScroll: (perMoveSpacing: number, callBack: (moveSpacing: number) => any) => void
  sortTimeLineNodes: (timeLineNodes: TimeLineNode[]) => void,
  mergeOverlapTimeLine: (timeLineNodes: TimeLineNode[]) => TimeLineNode[],
  freshVisibleTimeLines: (freshAll?: boolean) => void
  getDiffSecondByDistance: (distance: number, startDate: dayjs.Dayjs) => dayjs.Dayjs,
  emitUpdateMinDate: (date: dayjs.Dayjs) => void,
  emitUpdateMaxDate: (date: dayjs.Dayjs) => void,
  updateParentTimeLine: (rowId: string) => void
}) => {
  const wrapRef = inject('wrapRef') as Ref<HTMLDivElement | undefined>;
  const freshRowNodeDateByTimeLine = inject('freshRowNodeDateByTimeLine') as (rowId: string) => void;
  const getGanttMinAndMaxDate = inject('getGanttMinAndMaxDate') as (excludeRowIds?: string[], freshStartDate?: boolean, freshEndDate?: boolean)
  => { minStartDate: dayjs.Dayjs | null, maxEndDate: dayjs.Dayjs | null };
  const timeLineMoveChange = inject('timeLineMoveChange') as (rowId: string, timeLineIds: string[], movedTimeData: MovedTimeLineData[]) => void;

  const startTimeLineMove = (e: MouseEvent, timeLine: VisibleTimeLine, rowId: string) => {
    timeLine.moving = true;
    movingTimeLine.value = timeLine;
    movingTimeLineRowId.value = rowId;
    let lastX = e.clientX;
    let startScrollX = 0;
    const wrapWidth = wrapRef.value!.offsetWidth;
    const oldStartDate = timeLine.startDate;
    const currentRowNode = rowNodeMap.value.get(rowId);

    const onMouseMove = (event: MouseEvent) => {
      let currentX = event.clientX;
      const layerX = event.layerX;
      const diffX = currentX - lastX;
      timeLineMove(timeLine, rowId, diffX);

      const scrollDistance = 10;
      const scrollLeft = wrapRef.value!.scrollLeft;

      if (layerX <= scrollLeft + edgeSpacing || timeLine.translateX <= edgeSpacing) {
        if (diffX < 0) {
          if (!timeLineMoving.value) {
            timeLineMoving.value = true;
            startScrollX = lastX;
            closeEdgeScroll(-scrollDistance, (moveSpacing) => {
              timeLineMove(timeLine, rowId, moveSpacing);
            });
          }
        } else if (currentX >= startScrollX) {
          timeLineMoving.value = false;
        }

      } else if (layerX >= wrapWidth + scrollLeft - edgeSpacing || timeLine.translateX + timeLine.width >= ganttViewWidth.value - edgeSpacing) {
        if (diffX > 0) {
          if (!timeLineMoving.value) {
            timeLineMoving.value = true;
            startScrollX = lastX;
            closeEdgeScroll(scrollDistance, (moveSpacing) => {
              timeLineMove(timeLine, rowId, moveSpacing);
            });
          }
        } else if (currentX <= startScrollX) {
          timeLineMoving.value = false;
        }

      } else {
        timeLineMoving.value = false;
      }

      lastX = currentX;

    };
    const onMouseUp = () => {
      timeLine.moving = false;
      timeLineMoving.value = false;
      movingTimeLine.value = null;
      movingTimeLineRowId.value = '';
      if (!oldStartDate.isSame(timeLine.startDate)) {
        freshRowNodeDateByTimeLine(rowId);
        if (currentRowNode?.timeLineNodes) {
          sortTimeLineNodes(currentRowNode.timeLineNodes);
          currentRowNode.timeLineNodes = mergeOverlapTimeLine(currentRowNode.timeLineNodes);
          const diffSecond = timeLine.startDate.diff(oldStartDate, 'second', true);
          onTimeLineMoveChange(rowId, timeLine, diffSecond);
          visibleTimeLineMap.value.delete(rowId);
          freshVisibleTimeLines(false);
        }
      }
      triggerRef(visibleTimeLineMap);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    triggerRef(visibleTimeLineMap);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const timeLineMove = (timeLine: VisibleTimeLine, rowId: string, distance: number) => {
    const nextStartDate = getDiffSecondByDistance(distance, timeLine.startDate);
    timeLine.startDate = nextStartDate;
    timeLine.timeLineNode.startDate = nextStartDate;
    const nextEndDate = getDiffSecondByDistance(distance, timeLine.endDate);
    timeLine.endDate = nextEndDate;
    timeLine.timeLineNode.endDate = nextEndDate;
    if (timeLine.translateX === edgeSpacing && distance > 0) {
      const { minStartDate } = getGanttMinAndMaxDate([rowId], true, false);
      if (!minStartDate || nextStartDate.isBefore(minStartDate)) {
        emitUpdateMinDate(nextStartDate);
        timeLine.translateX = edgeSpacing;
        updateParentTimeLine(rowId);
        return;
      } else if (nextStartDate.isAfter(minStartDate) || nextStartDate.isSame(minStartDate)) {
        emitUpdateMinDate(minStartDate);
      }
    } else if (getRound(timeLine.translateX + timeLine.width + edgeSpacing) === getRound(ganttViewWidth.value) && distance < 0) {
      const { maxEndDate } = getGanttMinAndMaxDate([rowId], false, true);
      if (!maxEndDate || nextEndDate.isAfter(maxEndDate)) {
        timeLine.translateX += distance;
        emitUpdateMaxDate(nextEndDate);
        updateParentTimeLine(rowId);
        return;
      } else if (nextEndDate.isBefore(maxEndDate) || nextEndDate.isSame(maxEndDate)) {
        emitUpdateMaxDate(maxEndDate);

      }
    }
    timeLine.translateX += distance;
    if (timeLine.translateX < edgeSpacing) {
      emitUpdateMinDate(timeLine.startDate);
      timeLine.translateX = edgeSpacing;
    } else if (timeLine.translateX + timeLine.width + edgeSpacing > ganttViewWidth.value) {
      emitUpdateMaxDate(timeLine.endDate);
    }
    updateParentTimeLine(rowId);
    triggerRef(visibleTimeLineMap);
  };

  const onTimeLineMoveChange = (rowId: string, timeLine: VisibleTimeLine, diffSecond: number) => {
    const timeLineNode = timeLine.timeLineNode;
    const timeLineIds: string[] = [timeLineNode.id];
    const result: MovedTimeLineData[] = [
      {
        timeLineId: timeLineNode.id,
        startDate: timeLineNode.startDate,
        endDate: timeLineNode.endDate
      }
    ];

    if (timeLineNode.isMerge) {
      const mergedTimeLineNodes = timeLineNode.mergedTimeLineNodes;
      for (let mergedTimeLineNode of mergedTimeLineNodes!) {
        if (mergedTimeLineNode.id !== timeLineNode.id) {
          timeLineIds.push(mergedTimeLineNode.id);
          mergedTimeLineNode.startDate = mergedTimeLineNode.startDate.add(diffSecond, 'second');
          mergedTimeLineNode.endDate = mergedTimeLineNode.endDate.add(diffSecond, 'second');
          result.push({
            timeLineId: mergedTimeLineNode.id,
            startDate: mergedTimeLineNode.startDate,
            endDate: mergedTimeLineNode.endDate
          });
        }
      }
    }
    timeLineMoveChange(rowId, timeLineIds, result);
  };

  return {
    startTimeLineMove
  };
};