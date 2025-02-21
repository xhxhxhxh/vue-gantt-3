<template>
  <div class="m-gantt-time-line-view">
    <div v-for="row in visibleRows"
         :key="row.id"
         class="m-gantt-time-line-row m-gantt-row"
         :data-row-id="row.id"
         :class="{'m-gantt-selected-row': selectedRowIds.has(row.id)}"
         :style="{height: rowHeight + 'px', transform: `translateY(${row.translateY}px)`}">
      <div v-for="timeLine in visibleTimeLineMap.get(row.id)"
           :key="timeLine.id"
           :style="{width: timeLine.width + 'px', transform: `translateX(${timeLine.translateX}px)`}"
           class="m-gantt-time-line-row-time-line">
        <div v-if="timeLine.type === 'normal'" class="m-gantt-time-line-normal" :style="{ backgroundColor: getTimeLineBackgroundColor(timeLine)}">
          <div v-show="styleOption?.barsLabeling !== 'none'"
               class="m-gantt-time-line-label"
               :class="{toLeft: styleOption?.barsLabeling === 'beforeTheBar', toRight: styleOption?.barsLabeling === 'afterTheBar'}">
            <img v-show="styleOption?.barsLabeling === 'insideBarWithIcon' && timeLine.icon" :src="timeLine.icon" alt="">
            <span>{{ timeLine.label || '' }}</span>
          </div>
          <div v-for="timePoint in timeLine.timePointNodes?.filter((() => styleOption?.showTimePoints))"
               :key="timePoint.id"
               class="m-gantt-time-line-normal-time-points"
               :style="{transform: `translate(${timePoint.translateX - timePointSize / 2 - 1}px, -50%)`, width: `${timePointSize}px`, height: `${timePointSize}px`}"
               @contextmenu.stop="e => onTimePointContextMenu(e, timeLine, timePoint, row.id)"
               @mousedown.stop="e => onTimePointMouseDown(e, timeLine, timePoint)">
            <component :is="timePointComp" v-if="timePoint.useTimePointComp" v-bind="timePoint.compParams"></component>
            <img v-else :src="timePoint.icon" alt="">
          </div>
        </div>
        <div v-if="timeLine.type === 'parentTimeLineNode'" class="m-gantt-time-line-parentNode">
          <div class="m-gantt-time-line-parentNode-bar"></div>
          <img class="m-gantt-time-line-parentNode-triangle m-gantt-time-line-parentNode-triangle-left" src="../../../../assets/images/BlackTriangle.svg">
          <img class="m-gantt-time-line-parentNode-triangle m-gantt-time-line-parentNode-triangle-right" src="../../../../assets/images/BlackTriangle.svg">
        </div>
        <div v-if="timeLine.type === 'sameDateTimeLineNode'" class="m-gantt-time-line-sameNode"></div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, inject, Ref, onMounted, computed, watch, toRef, onBeforeUnmount, shallowRef, triggerRef } from 'vue';
import dayjs, { Dayjs } from 'dayjs';
import { GanttRowNode, VisibleRow, TimeLine, TimeLineNode, VisibleTimeLine, MGanttStyleOption, TimePointNode, TimePoint, RowData } from '@/types';
import minMax from 'dayjs/plugin/minMax';
import isBetween from 'dayjs/plugin/isBetween';
import { treeForEach } from '@/util';

dayjs.extend(minMax);
dayjs.extend(isBetween);

export interface Props {
  rowHeight: number,
  ganttMinDate: dayjs.Dayjs,
  perHourSpacing: number,
  rowBuffer: number,
  visibleRowIds: string[],
  rowNodeMap: Map<string, GanttRowNode>,
  edgeSpacing: number,
  styleOption?: MGanttStyleOption,
  timePointComp?: any
}
console.log('ganttTimeLine');
const props = defineProps<Props>();

const wrapRef = inject('wrapRef') as Ref<HTMLDivElement | undefined>;

const scrollViewScrollTop = ref(0);
const scrollViewScrollLeft = ref(0);
const currentVisibleRowIds = toRef(props, 'visibleRowIds');

const visibleRows = shallowRef<VisibleRow[]>([]);
const visibleTimeLineMap = shallowRef<Map<string, VisibleTimeLine[]>>(new Map());
const bufferWidth = 200;
const selectedRowIds = inject('selectedRowIds') as Ref<Set<string>>;

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
        const timeLineNodesAfterCombine = combineOverlapTimeLine(timeLineNodes);
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

    timeLineNodes.sort((date1, date2) => {
      if (date1.startDate.isSame(date2.startDate)) return 0;
      if (date1.startDate.isBefore(date2.startDate)) {
        return -1;
      } else {
        return 1;
      }
    });
    return timeLineNodes;
  }
};

// 如果时间线之间有重叠区域需要将两个时间线合并
const combineOverlapTimeLine = (timeLineNodes: TimeLineNode[]) => {
  const newTimeLineNodes: TimeLineNode[] = [];
  for (let timeLineNode of timeLineNodes) {
    const lastTimeLineNode = newTimeLineNodes[newTimeLineNodes.length - 1];
    if (lastTimeLineNode && !timeLineNode.startDate.isAfter(lastTimeLineNode.endDate)) {
      const maxEndDate = dayjs.max([lastTimeLineNode.endDate, timeLineNode.endDate]);
      maxEndDate && (lastTimeLineNode.endDate = maxEndDate);
      // 时间线中如果有时间点应该不支持合并
      // if (lastTimeLineNode.timePointNodes && timeLineNode.timePointNodes) {
      //   lastTimeLineNode.timePointNodes = lastTimeLineNode.timePointNodes.concat(timeLineNode.timePointNodes)
      // }
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
      for (let i = startIndex; i < endIndex; i++) {
        const currentTimeNode = timeLineNodes[i];
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
          width,
          translateX,
          styleOption: currentTimeNode.styleOption,
          type,
          timePointNodes,
          icon: currentTimeNode.icon,
          label: currentTimeNode.label,
        });
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

defineExpose({
  onScroll,
  onResize,
  freshTimeLines
});
</script>
<style lang="scss">
.m-gantt-time-line-view {
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  position: absolute;
  .m-gantt-time-line-row {
    position: absolute;
    width: 100%;
    &.m-gantt-selected-row {
      background-color: #747AD0;
    }
    .m-gantt-time-line-row-time-line {
      position: absolute;
      left: 0;
      height: 100%;

      .m-gantt-time-line-normal {
        position: absolute;
        width: 100%;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        height: 16px;
        border-radius: 16px;
        border: 1px solid #000;
        background: #fff;
        .m-gantt-time-line-normal-time-points {
          cursor: move;
          position: absolute;
          left: 0;
          top: 50%;
          > img {
            width: 100%;
            height: 100%;
          }
        }
      }
      .m-gantt-time-line-sameNode {
        width: 8px;
        height: 8px;
        position: absolute;
        left: 0;
        top: 50%;
        background-color: #000;
        transform: translate(-50%, -50%) rotate(45deg);
      }
      .m-gantt-time-line-parentNode {
        position: absolute;
        width: 100%;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        height: 16px;
        .m-gantt-time-line-parentNode-bar {
          position: absolute;
          width: 100%;
          top: 2.5px;
          height: 7px;
          background-color: #000;
        }
        .m-gantt-time-line-parentNode-triangle {
          position: absolute;
          top: 50%;
          &.m-gantt-time-line-parentNode-triangle-left {
            left: 0;
            transform: translateX(-50%) translateY(-50%);
          }
          &.m-gantt-time-line-parentNode-triangle-right {
            right: 0;
            transform: translateX(50%) translateY(-50%);
          }
        }
      }
      .m-gantt-time-line-label {
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