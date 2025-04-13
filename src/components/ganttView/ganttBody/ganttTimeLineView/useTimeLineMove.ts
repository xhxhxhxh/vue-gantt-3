import { inject, triggerRef } from 'vue';
import type { Ref, ShallowRef, ComputedRef } from 'vue';
import type { GanttRowNode, VisibleTimeLine, TimeLineNode, MovedTimeLineData, TimePointNode } from '@/types';
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
  disableMove,
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
  disableMove: ComputedRef<boolean | undefined>,
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
  const clearDateCache = inject('clearDateCache') as () => void;

  /**
   * handle time line move
   * @param e
   * @param timeLine
   * @param rowId
   */
  const startTimeLineMove = (e: MouseEvent, timeLine: VisibleTimeLine, rowId: string) => {
    if (disableMove.value || timeLine.disableMove) return;
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
      clearDateCache();
      if (!oldStartDate.isSame(timeLine.startDate)) {
        // update row node date
        freshRowNodeDateByTimeLine(rowId);
        if (currentRowNode?.timeLineNodes) {
          // if time line overlap, merge them
          sortTimeLineNodes(currentRowNode.timeLineNodes);
          currentRowNode.timeLineNodes = mergeOverlapTimeLine(currentRowNode.timeLineNodes);

          // if timeline is a merge node, update all merged nodes' date
          const diffSecond = timeLine.startDate.diff(oldStartDate, 'second', true);
          onTimeLineMoveChange(rowId, timeLine, diffSecond);

          // fresh visible time lines
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

  /**
   * calculate time line position, date and gantt min and max date
   * @param timeLine
   * @param rowId
   * @param distance
   * @returns
   */
  const timeLineMove = (timeLine: VisibleTimeLine, rowId: string, distance: number) => {
    const nextStartDate = getDiffSecondByDistance(distance, timeLine.startDate);
    timeLine.startDate = nextStartDate;
    timeLine.timeLineNode.startDate = nextStartDate;
    const nextEndDate = getDiffSecondByDistance(distance, timeLine.endDate);
    timeLine.endDate = nextEndDate;
    timeLine.timeLineNode.endDate = nextEndDate;
    if (getRound(timeLine.translateX) === edgeSpacing && distance > 0) {
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

  /**
   * update merged time line nodes' date, and notice user
   * @param rowId
   * @param timeLine
   * @param diffSecond
   */
  const onTimeLineMoveChange = (rowId: string, timeLine: VisibleTimeLine, diffSecond: number) => {
    const timeLineNode = timeLine.timeLineNode;
    const mergedTimeLineNodes = timeLineNode.mergedTimeLineNodes || []
    const allTimeLineNodes = [timeLineNode, ...mergedTimeLineNodes.filter(node => node.id !== timeLineNode.id)];
    const timeLineIds: string[] = [];
    const result: MovedTimeLineData[] = [];

    for (let currentTimeLineNode of allTimeLineNodes) {
      timeLineIds.push(currentTimeLineNode.id);
      if (currentTimeLineNode.id !== timeLineNode.id) {
        currentTimeLineNode.startDate = currentTimeLineNode.startDate.add(diffSecond, 'second');
        currentTimeLineNode.endDate = currentTimeLineNode.endDate.add(diffSecond, 'second');
      }
      const movedResult: MovedTimeLineData = {
        timeLineId: currentTimeLineNode.id,
        startDate: currentTimeLineNode.startDate,
        endDate: currentTimeLineNode.endDate
      }
      
      if (currentTimeLineNode.timePointNodes) {
        const timePointsData: Pick<TimePointNode, 'id' | 'date'>[] = []
        currentTimeLineNode.timePointNodes.forEach(timePointNode => {
          timePointNode.date = timePointNode.date.add(diffSecond, 'second');
          timePointsData.push({ id: timePointNode.id, date: timePointNode.date });
        });
        movedResult.timePoints = timePointsData;
      }
      result.push(movedResult);
    }
    timeLineMoveChange(rowId, timeLineIds, result);
  };

  return {
    startTimeLineMove
  };
};