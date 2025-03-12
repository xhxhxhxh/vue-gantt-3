<template>
  <div class="vg-time-line-view">
    <div v-for="row in visibleRows"
         :key="row.id"
         class="vg-time-line-row vg-row"
         :data-row-id="row.id"
         :class="{'vg-selected-row': selectedRowIds.has(row.id)}"
         :style="{height: rowHeight + 'px', transform: `translateY(${row.translateY}px)`}">
      <div v-for="timeLine in visibleTimeLineMap.get(row.id)"
           :key="timeLine.id"
           :style="{width: timeLine.width + 'px', transform: `translateX(${timeLine.translateX}px)`}"
           class="vg-time-line-row-time-line">
        <div v-if="timeLine.type === 'normal'"
             class="vg-time-line-normal"
             :class="{moving: timeLine.moving === true}"
             :style="{ backgroundColor: getTimeLineBackgroundColor(timeLine)}"
             @mousedown="e => startTimeLineMove(e, timeLine, row.id)">
          <div class="vg-move-block" @mousedown="e => startTimeLineStretch(e, timeLine, row.id, 'left')"></div>
          <div v-show="styleOption?.barsLabeling !== 'none'"
               class="vg-time-line-label"
               :class="{toLeft: styleOption?.barsLabeling === 'beforeTheBar', toRight: styleOption?.barsLabeling === 'afterTheBar'}">
            <img v-show="styleOption?.barsLabeling === 'insideBarWithIcon' && timeLine.icon" :src="timeLine.icon" alt="">
            <span>{{ timeLine.label || '' }}</span>
          </div>
          <div class="vg-move-block" @mousedown="e => startTimeLineStretch(e, timeLine, row.id, 'right')"></div>
          <div v-for="timePoint in timeLine.timePointNodes?.filter((() => styleOption?.showTimePoints))"
               :key="timePoint.id"
               class="vg-time-line-normal-time-points"
               :style="{transform: `translate(${timePoint.translateX - timePointSize / 2 - 1}px, -50%)`, width: `${timePointSize}px`, height: `${timePointSize}px`}"
               @contextmenu.stop="e => onTimePointContextMenu(e, timeLine, timePoint, row.id)"
               @mousedown.stop="e => onTimePointMouseDown(e, timeLine, timePoint)">
            <component :is="timePointComp" v-if="timePoint.useTimePointComp" v-bind="timePoint.compParams"></component>
            <img v-else :src="timePoint.icon" alt="">
          </div>
        </div>
        <div v-if="timeLine.type === 'parentTimeLineNode'" class="vg-time-line-parentNode">
          <div class="vg-time-line-parentNode-bar"></div>
          <img class="vg-time-line-parentNode-triangle vg-time-line-parentNode-triangle-left" src="../../../../assets/images/BlackTriangle.svg">
          <img class="vg-time-line-parentNode-triangle vg-time-line-parentNode-triangle-right" src="../../../../assets/images/BlackTriangle.svg">
        </div>
        <div v-if="timeLine.type === 'sameDateTimeLineNode'" class="vg-time-line-sameNode"></div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, inject, Ref, onMounted, computed, watch, toRef, onBeforeUnmount, shallowRef, triggerRef, nextTick } from 'vue';
import dayjs, { Dayjs } from 'dayjs';
import { GanttRowNode, VisibleRow, TimeLine, TimeLineNode, VisibleTimeLine, MGanttStyleOption, TimePointNode, TimePoint, RowData, MovedTimeLineData } from '@/types';
import minMax from 'dayjs/plugin/minMax';
import isBetween from 'dayjs/plugin/isBetween';
import { getRound, toMap, treeForEach } from '@/utils/common';

dayjs.extend(minMax);
dayjs.extend(isBetween);

export interface Props {
  rowHeight: number,
  ganttMinDate: dayjs.Dayjs,
  ganttMaxDate: dayjs.Dayjs | null,
  perHourSpacing: number,
  rowBuffer: number,
  visibleRowIds: string[],
  rowNodeMap: Map<string, GanttRowNode>,
  ganttViewWidth: number,
  edgeSpacing: number,
  styleOption?: MGanttStyleOption,
  timePointComp?: any
}
console.log('ganttTimeLine');
const props = defineProps<Props>();

const emit = defineEmits<{
  (event: 'updateMinDate', date: dayjs.Dayjs): void,
  (event: 'updateMaxDate', date: dayjs.Dayjs): void,
}>();

const wrapRef = inject('wrapRef') as Ref<HTMLDivElement | undefined>;
const getGanttMinAndMaxDate = inject('getGanttMinAndMaxDate') as (excludeRowIds?: string[], freshStartDate?: boolean, freshEndDate?: boolean)
 => { minStartDate: dayjs.Dayjs | null, maxEndDate: dayjs.Dayjs | null };
const freshRowNodeDateByTimeLine = inject('freshRowNodeDateByTimeLine') as (rowId: string) => void;
const timeLineStretchChange = inject('timeLineStretchChange') as (rowId: string, timeLineIds: string[], startDate: dayjs.Dayjs | null, endDate: dayjs.Dayjs | null) => void;
const timeLineMoveChange = inject('timeLineMoveChange') as (rowId: string, timeLineIds: string[], movedTimeData: MovedTimeLineData[]) => void;

const scrollViewScrollTop = ref(0);
const scrollViewScrollLeft = ref(0);
const currentVisibleRowIds = toRef(props, 'visibleRowIds');

const visibleRows = shallowRef<VisibleRow[]>([]);
const visibleTimeLineMap = shallowRef<Map<string, VisibleTimeLine[]>>(new Map());
const bufferWidth = 200;
const selectedRowIds = inject('selectedRowIds') as Ref<Set<string>>;
let timeLineMoving = false;
let movingTimeLine: VisibleTimeLine | null = null;
let movingTimeLineRowId = '';

const timePointSize = computed(() => {
  return props.styleOption?.timePointSize || 28;
});

const getTimeLineBackgroundColor = (timeLine: VisibleTimeLine) => {
  return (timeLine.styleOption?.backgroundColor || props.styleOption?.barColor || '') as string;
};

const freshTimeLineView = () => {
  console.time('freshTimeLineView');
  freshVisibleRows();
  freshVisibleTimeLines();
  console.timeEnd('freshTimeLineView');
};

const freshTimeLineViewAfterScrollTop = () => {
  console.time('freshTimeLineView');
  freshVisibleRows();
  freshVisibleTimeLines(false);
  console.timeEnd('freshTimeLineView');
};

const freshVisibleRows = () => {
  if (!wrapRef.value) return;
  console.log('freshVisibleRows');
  const { rowHeight, rowBuffer, rowNodeMap } = props;
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

const createTimePointNodes = (timeLine: TimeLine) => {
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

const startInfo = computed(() => {
  const { perHourSpacing, edgeSpacing, ganttMinDate } = props;
  const diffHour = edgeSpacing / perHourSpacing;
  const startDate = ganttMinDate.subtract(diffHour, 'hour');

  return {
    startDate,
  };
});

const freshVisibleTimeLines = (freshAll = true) => {
  if (!wrapRef.value) return;
  console.log('freshVisibleTimeLines');
  const { perHourSpacing } = props;
  const wrapWidth = wrapRef.value.offsetWidth;
  const { startDate } = startInfo.value;
  const startLeftInView = scrollViewScrollLeft.value - bufferWidth;
  const endLeftInView = scrollViewScrollLeft.value + wrapWidth + bufferWidth;

  const startDateInView = startDate.add(Math.max(0, startLeftInView) / perHourSpacing, 'hour');
  const endDateInView = startDate.add(endLeftInView / perHourSpacing, 'hour');

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
      const hasMovingTimeLine = movingTimeLineRowId === rowId;
      for (let i = startIndex; i < endIndex; i++) {
        const currentTimeNode = timeLineNodes[i];

        if (hasMovingTimeLine && currentTimeNode.id === movingTimeLine?.id) continue;

        const currentStartDate = currentTimeNode.startDate;
        const currentEndDate = currentTimeNode.endDate;
        const translateX = currentStartDate.diff(startDate, 'hour', true) * perHourSpacing;
        const width = currentTimeNode.isSameDate ? 0 : currentEndDate.diff(currentStartDate, 'hour', true) * perHourSpacing;
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
            const timePointNodeTranslateX = timePointNode.date.diff(currentStartDate, 'hour', true) * perHourSpacing;
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
        visibleTimeLines.push(movingTimeLine!);
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

watch([currentVisibleRowIds, scrollViewScrollTop], freshTimeLineViewAfterScrollTop);
watch([startInfo, scrollViewScrollLeft], () => freshVisibleTimeLines(true));

const onScroll = ({ scrollTop, scrollLeft }: {scrollTop: number, scrollLeft: number}) => {
  scrollViewScrollTop.value = scrollTop;
  scrollViewScrollLeft.value = scrollLeft;
};

const onResize = (target: HTMLDivElement) => {
  freshTimeLineView();

};

const timePointMoveFinished = inject('timePointMoveFinished') as (timePoint: TimePoint, date: Dayjs) => void;

const onTimePointMouseDown = (e: MouseEvent, timeLine: VisibleTimeLine, timePoint: TimePointNode) => {
  const startX = e.clientX;
  const startTranslateX = timePoint.translateX;
  const { perHourSpacing } = props;
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
      const diffSecond = diffX / perHourSpacing * 60 * 60;
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

const timePointContextMenu = inject('timePointContextMenu') as (e: MouseEvent, timePoints: TimePoint[], rowNode?: GanttRowNode) => void;

const onTimePointContextMenu = (e: MouseEvent, timeLine: VisibleTimeLine, timePoint: TimePointNode, rowId: string) => {
  const offsetX = e.offsetX;
  const { perHourSpacing } = props;
  const diffX = offsetX - timePointSize.value / 2;
  const diffSecond = diffX / perHourSpacing * 60 * 60;
  const halfSeconf = timePointSize.value / 2 / perHourSpacing * 60 * 60;
  const clickedDate = timePoint.date.add(diffSecond, 'second');
  const minDate = clickedDate.add(-halfSeconf, 'second');
  const maxDate = clickedDate.add(halfSeconf, 'second');
  const selectedTimePoints = timeLine.timePointNodes?.filter(timePointNode => {
    return timePointNode.date.isBetween(minDate, maxDate);
  }) || [];
  const selectedTimePointsData = selectedTimePoints.map(timePointNode => timePointNode.data);
  timePointContextMenu(e, selectedTimePointsData, props.rowNodeMap.get(rowId));
};

const freshTimeLines = (rowNodes: GanttRowNode[]) => {
  if (rowNodes.length === 0) return;
  const { rowNodeMap } = props;
  treeForEach(rowNodes, (rowNode) => {
    const currentRowId = rowNode.id;
    const currentRowNode = rowNodeMap.get(currentRowId);
    currentRowNode && (currentRowNode.timeLineNodes = undefined);
    visibleTimeLineMap.value.delete(currentRowId);
  });
  freshTimeLineViewAfterScrollTop();
};

const startTimeLineStretch = (e: MouseEvent, timeLine: VisibleTimeLine, rowId: string, direction: 'left' | 'right') => {
  let lastX = e.clientX;
  const oldWidth = timeLine.width;
  const { edgeSpacing, rowNodeMap } = props;
  const minWidth = 4;
  const wrapWidth = wrapRef.value!.offsetWidth;
  const currentRowNode = rowNodeMap.get(rowId);
  let invalidDistance = 0;
  let startScrollX = 0;
  movingTimeLine = timeLine;
  movingTimeLineRowId = rowId;
  e.stopPropagation();
  const onMouseMove = (event: MouseEvent) => {
    let currentX = event.clientX;
    const diffX = currentX - lastX;
    console.log('onMouseMove');

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
        if (!timeLineMoving) {
          timeLineMoving = true;
          startScrollX = lastX;
          closeEdgeScroll(-scrollDistance, (moveSpacing) => {
            if (direction === 'right' && timeLine.width - scrollDistance < minWidth) {
              timeLineMoving = false;
              invalidDistance -= minWidth - timeLine.width + scrollDistance;
            }
            timeLineStretch(timeLine, rowId, moveSpacing, minWidth, direction);
          });
        }
      } else if (currentX >= startScrollX) {
        timeLineMoving = false;
      }

    } else if ((direction === 'right' && scrollLeft + wrapWidth <= timeLine.translateX + timeLine.width + edgeSpacing)
     || (direction === 'left' && scrollLeft + wrapWidth <= timeLine.translateX + edgeSpacing)) {
      if (diffX > 0) {
        if (!timeLineMoving) {
          timeLineMoving = true;
          startScrollX = lastX;
          closeEdgeScroll(scrollDistance, (moveSpacing) => {
            if (direction === 'left' && timeLine.width - scrollDistance < minWidth) {
              timeLineMoving = false;
              invalidDistance += minWidth - timeLine.width + scrollDistance;
            }
            timeLineStretch(timeLine, rowId, moveSpacing, minWidth, direction);
          });
        }
      } else if (currentX <= startScrollX) {
        timeLineMoving = false;
      }

    } else {
      timeLineMoving = false;
    }
    lastX = currentX;

  };
  const onMouseUp = () => {
    timeLineMoving = false;
    movingTimeLine = null;
    movingTimeLineRowId = '';
    if (timeLine.width !== oldWidth) {
      freshRowNodeDateByTimeLine(rowId);
      if (currentRowNode?.timeLineNodes) {
        sortTimeLineNodes(currentRowNode.timeLineNodes);
        currentRowNode.timeLineNodes = mergeOverlapTimeLine(currentRowNode.timeLineNodes);
        onTimeLineStretchChange(rowId, timeLine, direction);
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

const startTimeLineMove = (e: MouseEvent, timeLine: VisibleTimeLine, rowId: string) => {
  const { edgeSpacing, rowNodeMap, ganttViewWidth } = props;

  timeLine.moving = true;
  movingTimeLine = timeLine;
  movingTimeLineRowId = rowId;
  let lastX = e.clientX;
  let startScrollX = 0;
  const wrapWidth = wrapRef.value!.offsetWidth;
  const oldStartDate = timeLine.startDate;
  const currentRowNode = rowNodeMap.get(rowId);

  const onMouseMove = (event: MouseEvent) => {
    let currentX = event.clientX;
    const layerX = event.layerX;
    const diffX = currentX - lastX;
    const oldTranslateX = timeLine.translateX;
    timeLineMove(timeLine, rowId, diffX);

    const scrollDistance = 10;
    const scrollLeft = wrapRef.value!.scrollLeft;

    if (layerX <= scrollLeft + edgeSpacing || timeLine.translateX <= edgeSpacing) {
      if (diffX < 0) {
        if (!timeLineMoving) {
          timeLineMoving = true;
          startScrollX = lastX;
          closeEdgeScroll(-scrollDistance, (moveSpacing) => {
            timeLineMove(timeLine, rowId, moveSpacing);
          });
        }
      } else if (currentX >= startScrollX) {
        timeLineMoving = false;
      }

    } else if (layerX >= wrapWidth + scrollLeft - edgeSpacing || timeLine.translateX + timeLine.width >= ganttViewWidth - edgeSpacing) {
      if (diffX > 0) {
        if (!timeLineMoving) {
          timeLineMoving = true;
          startScrollX = lastX;
          closeEdgeScroll(scrollDistance, (moveSpacing) => {
            timeLineMove(timeLine, rowId, moveSpacing);
          });
        }
      } else if (currentX <= startScrollX) {
        timeLineMoving = false;
      }

    } else {
      timeLineMoving = false;
    }

    lastX = currentX;

  };
  const onMouseUp = () => {
    timeLine.moving = false;
    timeLineMoving = false;
    movingTimeLine = null;
    movingTimeLineRowId = '';
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

const getDiffSecondByDistance = (distance: number, startDate: dayjs.Dayjs) => {
  const { perHourSpacing } = props;

  const diffSecond = distance / perHourSpacing * 60 * 60;
  return startDate.add(diffSecond, 'second');
};

const calcPerInvalidDistance = (timeLineWidth: number, distance: number, minWidth: number, direction: 'left' | 'right') => {
  if (direction === 'left') {
    return minWidth - timeLineWidth + distance;
  } else {
    return timeLineWidth + distance - minWidth;
  }
};

const timeLineStretch = (timeLine: VisibleTimeLine, rowId: string, distance: number, minWidth: number, direction: 'left' | 'right') => {
  const oldWidth = timeLine.width;
  const { edgeSpacing, ganttViewWidth } = props;
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
    if (timeLine.translateX === edgeSpacing && diffWidth > 0) {
      const { minStartDate } = getGanttMinAndMaxDate([rowId], true, false);
      if (!minStartDate || nextStartDate.isBefore(minStartDate)) {
        emit('updateMinDate', nextStartDate);
        timeLine.translateX = edgeSpacing;
        updateParentTimeLine(rowId);
        return;
      } else if (nextStartDate.isAfter(minStartDate)) {
        emit('updateMinDate', minStartDate);
      }
    }
    timeLine.translateX += diffWidth;
  } else {
    const nextEndDate = getDiffSecondByDistance(-diffWidth, timeLine.endDate);
    timeLine.timeLineNode.endDate = nextEndDate;
    timeLine.endDate = nextEndDate;
    if (getRound(timeLine.translateX + oldWidth + edgeSpacing) === getRound(ganttViewWidth) && diffWidth > 0) {
      const { maxEndDate } = getGanttMinAndMaxDate([rowId], false, true);
      if (!maxEndDate || nextEndDate.isAfter(maxEndDate)) {
        emit('updateMaxDate', nextEndDate);
        updateParentTimeLine(rowId);
        return;
      } else if (nextEndDate.isBefore(maxEndDate)) {
        emit('updateMaxDate', maxEndDate);
      }
    }
  }
  if (timeLine.translateX < edgeSpacing) {
    emit('updateMinDate', timeLine.startDate);
    timeLine.translateX = edgeSpacing;
  } else if (timeLine.translateX + timeLine.width + edgeSpacing > ganttViewWidth) {
    emit('updateMaxDate', timeLine.endDate);
  }
  updateParentTimeLine(rowId);
  triggerRef(visibleTimeLineMap);
};

const timeLineMove = (timeLine: VisibleTimeLine, rowId: string, distance: number) => {
  const { edgeSpacing, ganttViewWidth } = props;
  const nextStartDate = getDiffSecondByDistance(distance, timeLine.startDate);
  timeLine.startDate = nextStartDate;
  timeLine.timeLineNode.startDate = nextStartDate;
  const nextEndDate = getDiffSecondByDistance(distance, timeLine.endDate);
  timeLine.endDate = nextEndDate;
  timeLine.timeLineNode.endDate = nextEndDate;
  if (timeLine.translateX === edgeSpacing && distance > 0) {
    const { minStartDate } = getGanttMinAndMaxDate([rowId], true, false);
    if (!minStartDate || nextStartDate.isBefore(minStartDate)) {
      emit('updateMinDate', nextStartDate);
      timeLine.translateX = edgeSpacing;
      updateParentTimeLine(rowId);
      return;
    } else if (nextStartDate.isAfter(minStartDate)) {
      emit('updateMinDate', minStartDate);
    }
  } else if (getRound(timeLine.translateX + timeLine.width + edgeSpacing) === getRound(ganttViewWidth) && distance < 0) {
    const { maxEndDate } = getGanttMinAndMaxDate([rowId], false, true);
    if (!maxEndDate || nextEndDate.isAfter(maxEndDate)) {
      timeLine.translateX += distance;
      emit('updateMaxDate', nextEndDate);
      updateParentTimeLine(rowId);
      return;
    } else if (nextEndDate.isBefore(maxEndDate)) {
      emit('updateMaxDate', maxEndDate);
    }
  }
  timeLine.translateX += distance;
  if (timeLine.translateX < edgeSpacing) {
    emit('updateMinDate', timeLine.startDate);
    timeLine.translateX = edgeSpacing;
  } else if (timeLine.translateX + timeLine.width + edgeSpacing > ganttViewWidth) {
    emit('updateMaxDate', timeLine.endDate);
  }
  updateParentTimeLine(rowId);
  triggerRef(visibleTimeLineMap);
};

const closeEdgeScroll = (perMoveSpacing: number, callBack: (moveSpacing: number) => any) => {
  if (timeLineMoving) {
    console.log('moving');
    wrapRef.value!.scrollLeft += perMoveSpacing;
    callBack(perMoveSpacing);
    requestAnimationFrame(() => {
      closeEdgeScroll(perMoveSpacing, callBack);
    });
  }
};

const updateParentTimeLine = (rowId: string) => {
  const parentRowNode = props.rowNodeMap.get(rowId);
  const { perHourSpacing } = props;
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
            const translateX = parentTimeLineNode.startDate.diff(startDate, 'hour', true) * perHourSpacing;
            const width = parentTimeLineNode.endDate.diff(parentTimeLineNode.startDate, 'hour', true) * perHourSpacing;
            parentVisibleTimeLine.translateX = translateX;
            parentVisibleTimeLine.width = width;
          }
        }

      }
      parentRowNode.parentId && updateParentTimeLine(parentRowNode.parentId);
    }
  }
};

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

defineExpose({
  onScroll,
  onResize,
  freshTimeLines
});
</script>
<style lang="scss">
.vg-time-line-view {
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  position: absolute;
  .vg-time-line-row {
    position: absolute;
    width: 100%;
    &.vg-selected-row {
      background-color: #747AD0;
    }
    .vg-time-line-row-time-line {
      position: absolute;
      left: 0;
      height: 100%;
      user-select: none;
      .vg-time-line-normal {
        position: absolute;
        width: 100%;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        height: 16px;
        border-radius: 16px;
        border: 1px solid #000;
        background: #fff;
        cursor: grab;
        &.moving {
          cursor: grabbing;
        }
        .vg-time-line-normal-time-points {
          cursor: move;
          position: absolute;
          left: 0;
          top: 50%;
          > img {
            width: 100%;
            height: 100%;
          }
        }
        .vg-move-block {
          position: absolute;
          width: 6px;
          height: 100%;
          cursor: ew-resize;
          &:first-of-type {
            left: 0;
            transform: translateX(-100%);
          }
          &:last-of-type {
            right: 0;
            transform: translateX(100%);
          }
        }
      }
      .vg-time-line-sameNode {
        width: 8px;
        height: 8px;
        position: absolute;
        left: 0;
        top: 50%;
        background-color: #000;
        transform: translate(-50%, -50%) rotate(45deg);
      }
      .vg-time-line-parentNode {
        position: absolute;
        width: 100%;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        height: 16px;
        .vg-time-line-parentNode-bar {
          position: absolute;
          width: 100%;
          top: 3px;
          height: 7px;
          background-color: #000;
        }
        .vg-time-line-parentNode-triangle {
          position: absolute;
          top: 50%;
          &.vg-time-line-parentNode-triangle-left {
            left: 0;
            transform: translateX(-50%) translateY(-50%);
          }
          &.vg-time-line-parentNode-triangle-right {
            right: 0;
            transform: translateX(50%) translateY(-50%);
          }
        }
      }
      .vg-time-line-label {
        position: absolute;
        height: 100%;
        max-width: 100%;
        display: inline-flex;
        align-items: center;
        white-space: nowrap;
        overflow: hidden;
        &.toLeft {
          max-width: unset;
          left: -4px;
          transform: translateX(-100%);
        }
        &.toRight {
          max-width: unset;
          right: -4px;
          transform: translateX(100%);
        }
        span {
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }
}
</style>