import { inject, triggerRef } from 'vue';
import type { Ref, ShallowRef, ComputedRef } from 'vue';
import type { GanttRowNode, VisibleTimeLine, TimeLineNode } from '@/types';
import dayjs from 'dayjs';
import { getRound } from '@/utils/common';

export const useTimeLineStretch = ({
  edgeSpacing,
  ganttViewWidth,
  rowNodeMap,
  movingTimeLineRowId,
  movingTimeLine,
  timeLineMoving,
  visibleTimeLineMap,
  disableStretch,
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
  disableStretch: ComputedRef<boolean | undefined>,
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
  const timeLineStretchChange = inject('timeLineStretchChange') as (rowId: string, timeLineIds: string[], startDate: dayjs.Dayjs | null, endDate: dayjs.Dayjs | null) => void;
  const clearDateCache = inject('clearDateCache') as () => void;

  /**
   * handle time line stretch
   * @param e
   * @param timeLine
   * @param rowId
   * @param direction
   */
  const startTimeLineStretch = (e: MouseEvent, timeLine: VisibleTimeLine, rowId: string, direction: 'left' | 'right') => {
    if (disableStretch.value || timeLine.disableStretch) return;
    let lastX = e.clientX;
    const oldWidth = timeLine.width;
    const minWidth = 4;
    const wrapWidth = wrapRef.value!.offsetWidth;
    const currentRowNode = rowNodeMap.value.get(rowId);
    let invalidDistance = 0;
    let startScrollX = 0;
    movingTimeLine.value = timeLine;
    movingTimeLineRowId.value = rowId;
    e.stopPropagation();
    const onMouseMove = (event: MouseEvent) => {
      let currentX = event.clientX;
      const diffX = currentX - lastX;
      console.log('onMouseMove');

      // keep stretch if timeline width is less than minWidth, it will produce invalid distance,
      // then stretch on reverse direction, it will reduce invalid distance, stretch will be effected until invalid distance is 0
      const perInvalidDistance = calcPerInvalidDistance(timeLine.width, diffX, minWidth, direction);
      if (invalidDistance === 0) {
        timeLineStretch(timeLine, rowId, diffX, minWidth, direction);
      }
      const nextInvalidDistance = invalidDistance + perInvalidDistance;
      if ((nextInvalidDistance >= 0 && direction === 'left')
      || (nextInvalidDistance <= 0 && direction === 'right')) {
        invalidDistance += perInvalidDistance;
      } else if ((invalidDistance > 0 && nextInvalidDistance < 0 && direction === 'left')
      || (invalidDistance < 0 && nextInvalidDistance > 0 && direction === 'right')) {
        timeLineStretch(timeLine, rowId, nextInvalidDistance, minWidth, direction);
        invalidDistance = 0;
      }

      const scrollLeft = wrapRef.value!.scrollLeft;
      const scrollDistance = 10;
      if ((direction === 'left' && timeLine.translateX - scrollLeft <= edgeSpacing)
      || (direction === 'right' && timeLine.translateX + timeLine.width - scrollLeft <= edgeSpacing)) {
        if (diffX < 0) {
          if (!timeLineMoving.value) {
            timeLineMoving.value = true;
            startScrollX = lastX;
            closeEdgeScroll(-scrollDistance, (moveSpacing) => {
              if (direction === 'right' && timeLine.width - scrollDistance < minWidth) {
                timeLineMoving.value = false;
                invalidDistance -= minWidth - timeLine.width + scrollDistance;
              }
              timeLineStretch(timeLine, rowId, moveSpacing, minWidth, direction);
            });
          }
        } else if (currentX >= startScrollX) {
          timeLineMoving.value = false;
        }

      } else if ((direction === 'right' && scrollLeft + wrapWidth <= timeLine.translateX + timeLine.width + edgeSpacing)
       || (direction === 'left' && scrollLeft + wrapWidth <= timeLine.translateX + edgeSpacing)) {
        if (diffX > 0) {
          if (!timeLineMoving.value) {
            timeLineMoving.value = true;
            startScrollX = lastX;
            closeEdgeScroll(scrollDistance, (moveSpacing) => {
              if (direction === 'left' && timeLine.width - scrollDistance < minWidth) {
                timeLineMoving.value = false;
                invalidDistance += minWidth - timeLine.width + scrollDistance;
              }
              timeLineStretch(timeLine, rowId, moveSpacing, minWidth, direction);
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
      timeLineMoving.value = false;
      movingTimeLine.value = null;
      movingTimeLineRowId.value = '';
      clearDateCache();
      if (timeLine.width !== oldWidth) {
        // update row node date
        freshRowNodeDateByTimeLine(rowId);
        if (currentRowNode?.timeLineNodes) {
          // if time line overlap, merge them
          sortTimeLineNodes(currentRowNode.timeLineNodes);
          currentRowNode.timeLineNodes = mergeOverlapTimeLine(currentRowNode.timeLineNodes);

          // if timeline is a merge node, update all merged nodes' date
          onTimeLineStretchChange(rowId, timeLine, direction);

          // fresh visible time lines
          visibleTimeLineMap.value.delete(rowId);
          freshVisibleTimeLines(false);
        }
      }
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  /**
   * calculate time line position, date and gantt min and max date
   * @param timeLine
   * @param rowId
   * @param distance
   * @param minWidth
   * @param direction
   * @returns
   */
  const timeLineStretch = (timeLine: VisibleTimeLine, rowId: string, distance: number, minWidth: number, direction: 'left' | 'right') => {
    console.log('ganttViewWidth.value', ganttViewWidth.value);
    const oldWidth = timeLine.width;
    if (direction === 'left') {
      timeLine.width -= distance;
    } else {
      timeLine.width += distance;
    }
    if (timeLine.width < minWidth) {
      timeLine.width = minWidth;
    }
    const diffWidth = oldWidth - timeLine.width;
    if (direction === 'left') {
      const nextStartDate = getDiffSecondByDistance(diffWidth, timeLine.startDate);
      timeLine.timeLineNode.startDate = nextStartDate;
      timeLine.startDate = nextStartDate;
      if (getRound(timeLine.translateX) === edgeSpacing && diffWidth > 0) {
        const { minStartDate } = getGanttMinAndMaxDate([rowId], true, false);
        if (!minStartDate || nextStartDate.isBefore(minStartDate)) {
          emitUpdateMinDate(nextStartDate);
          timeLine.translateX = edgeSpacing;
          updateParentTimeLine(rowId);
          return;
        } else if (nextStartDate.isAfter(minStartDate) || nextStartDate.isSame(minStartDate)) {
          emitUpdateMinDate(minStartDate);
        }
      }
      timeLine.translateX += diffWidth;
    } else {
      const nextEndDate = getDiffSecondByDistance(-diffWidth, timeLine.endDate);
      timeLine.timeLineNode.endDate = nextEndDate;
      timeLine.endDate = nextEndDate;
      if (getRound(timeLine.translateX + oldWidth + edgeSpacing) === getRound(ganttViewWidth.value) && diffWidth > 0) {
        const { maxEndDate } = getGanttMinAndMaxDate([rowId], false, true);
        if (!maxEndDate || nextEndDate.isAfter(maxEndDate)) {
          emitUpdateMaxDate(nextEndDate);
          updateParentTimeLine(rowId);
          return;
        } else if (nextEndDate.isBefore(maxEndDate) || nextEndDate.isSame(maxEndDate)) {
          emitUpdateMaxDate(maxEndDate);
        }
      }
    }
    if (timeLine.translateX < edgeSpacing) {
      emitUpdateMinDate(timeLine.startDate);
      timeLine.translateX = edgeSpacing;
    } else if (timeLine.translateX + timeLine.width + edgeSpacing > ganttViewWidth.value) {
      emitUpdateMaxDate(timeLine.endDate);
    }
    updateParentTimeLine(rowId);
    triggerRef(visibleTimeLineMap);
  };

  const calcPerInvalidDistance = (timeLineWidth: number, distance: number, minWidth: number, direction: 'left' | 'right') => {
    if (direction === 'left') {
      return minWidth - timeLineWidth + distance;
    } else {
      return timeLineWidth + distance - minWidth;
    }
  };

  /**
   * update merged time line nodes' date, and notice user
   * @param rowId
   * @param timeLine
   * @param direction
   */
  const onTimeLineStretchChange = (rowId: string, timeLine: VisibleTimeLine, direction: 'left' | 'right') => {
    const timeLineNode = timeLine.timeLineNode;
    const timeLineIds: string[] = [timeLineNode.id];
    const finalStartDate = direction === 'left' ? timeLineNode.startDate : null;
    const finalEndDate = direction === 'right' ? timeLineNode.endDate : null;

    if (timeLineNode.isMerge) {
      const mergedTimeLineNodes = timeLineNode.mergedTimeLineNodes;
      for (let mergedTimeLineNode of mergedTimeLineNodes!) {
        if (direction === 'left') {
          if (mergedTimeLineNode.startDate.isBefore(timeLineNode.startDate)) {
            timeLineIds.push(mergedTimeLineNode.id);
            mergedTimeLineNode.startDate = timeLineNode.startDate;
          }
        } else {
          if (mergedTimeLineNode.endDate.isAfter(timeLineNode.endDate)) {
            timeLineIds.push(mergedTimeLineNode.id);
            mergedTimeLineNode.endDate = timeLineNode.endDate;
          }
        }
      }
    }
    timeLineStretchChange(rowId, timeLineIds, finalStartDate, finalEndDate);
  };
  return {
    startTimeLineStretch
  };
};