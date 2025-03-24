import { inject, triggerRef } from 'vue';
import type { ComputedRef, ShallowRef, Ref } from 'vue';
import type { GanttRowNode, TimePoint, TimeLine, TimePointNode, VisibleTimeLine } from '@/types';
import dayjs, { Dayjs } from 'dayjs';

export const createTimePointNodes = (timeLine: TimeLine) => {
  return timeLine.timePoints?.map(timePoint => {
    return {
      date: dayjs(timePoint.date),
      id: timePoint.id,
      data: timePoint,
      icon: timePoint.icon,
      useTimePointComp: timePoint.useTimePointComp,
      translateX: 0,
      compParams: timePoint.compParams
    };
  });
};

export const useTimePoint = ({
  timePointSize,
  perHourSpacing,
  rowNodeMap,
  visibleTimeLineMap
}: {
  timePointSize: ComputedRef<number>,
  perHourSpacing: Ref<number>,
  rowNodeMap: Ref<Map<string, GanttRowNode>, Map<string, GanttRowNode>>,
  visibleTimeLineMap: ShallowRef<Map<string, VisibleTimeLine[]>, Map<string, VisibleTimeLine[]>>
}) => {

  const timePointContextMenu = inject('timePointContextMenu') as (e: MouseEvent, timePoints: TimePoint[], rowNode?: GanttRowNode) => void;

  const onTimePointContextMenu = (e: MouseEvent, timeLine: VisibleTimeLine, timePoint: TimePointNode, rowId: string) => {
    const offsetX = e.offsetX;
    const diffX = offsetX - timePointSize.value / 2;
    const diffSecond = diffX / perHourSpacing.value * 60 * 60;
    const halfSeconf = timePointSize.value / 2 / perHourSpacing.value * 60 * 60;
    const clickedDate = timePoint.date.add(diffSecond, 'second');
    const minDate = clickedDate.add(-halfSeconf, 'second');
    const maxDate = clickedDate.add(halfSeconf, 'second');
    const selectedTimePoints = timeLine.timePointNodes?.filter(timePointNode => {
      return timePointNode.date.isBetween(minDate, maxDate);
    }) || [];
    const selectedTimePointsData = selectedTimePoints.map(timePointNode => timePointNode.data);
    timePointContextMenu(e, selectedTimePointsData, rowNodeMap.value.get(rowId));
  };

  const timePointMoveFinished = inject('timePointMoveFinished') as (timePoint: TimePoint, date: Dayjs) => void;

  /**
   * handle time point move
   * @param e
   * @param timeLine
   * @param timePoint
   */
  const onTimePointMouseDown = (e: MouseEvent, timeLine: VisibleTimeLine, timePoint: TimePointNode) => {
    const startX = e.clientX;
    const startTranslateX = timePoint.translateX;
    const onMouseMove = (event: MouseEvent) => {
      let currentX = event.clientX;
      const diffX = currentX - startX;
      let translateX = startTranslateX + diffX;
      if (translateX < 0) {
        translateX = 0;
      }
      if (translateX > timeLine.width) {
        translateX = timeLine.width;
      }
      timePoint.translateX = translateX;
      triggerRef(visibleTimeLineMap);
    };
    const onMouseUp = () => {
      if (timePoint.translateX !== startTranslateX) {
        const diffX = timePoint.translateX - startTranslateX;
        const diffSecond = diffX / perHourSpacing.value * 60 * 60;
        const roundOffSecond = diffX < 0 ? Math.ceil(diffSecond) : Math.floor(diffSecond);
        const newDate = timePoint.date.add(roundOffSecond, 'second');
        timePoint.date = newDate;
        timePointMoveFinished(timePoint.data, newDate);
      }
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  return {
    onTimePointContextMenu,
    onTimePointMouseDown
  };
};