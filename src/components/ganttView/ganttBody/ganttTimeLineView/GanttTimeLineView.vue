<template>
  <div class="vg-time-line-view">
    <div v-for="row in visibleRows"
         :key="row.id"
         class="vg-time-line-row vg-row"
         :data-row-id="row.id"
         :class="{'vg-selected-row': selectedRowIds.has(row.id)}"
         :style="{height: rowHeightRef + 'px', transform: `translateY(${row.translateY}px)`}">
      <div v-for="timeLine in visibleTimeLineMap.get(row.id)"
           :key="timeLine.id"
           :style="{width: timeLine.width + 'px', transform: `translateX(${timeLine.translateX}px)`}"
           class="vg-time-line-row-time-line">
        <div v-if="timeLine.type === 'normal'"
             class="vg-time-line-normal"
             :class="{moving: timeLine.moving === true, disabledMove: timeLine.disableMove || disableMove}"
             :style="{ backgroundColor: getTimeLineBackgroundColor(timeLine)}"
             @mousedown="e => startTimeLineMove(e, timeLine, row.id)">
          <div v-show="!timeLine.disableStretch && !disableStretch" class="vg-move-block" @mousedown="e => startTimeLineStretch(e, timeLine, row.id, 'left')"></div>
          <div v-show="styleOption?.barsLabeling !== 'none'"
               class="vg-time-line-label"
               :class="{toLeft: styleOption?.barsLabeling === 'beforeTheBar', toRight: styleOption?.barsLabeling === 'afterTheBar'}">
            <img v-show="styleOption?.barsLabeling === 'insideBarWithIcon' && timeLine.icon" :src="timeLine.icon" alt="">
            <span>{{ timeLine.label || '' }}</span>
          </div>
          <div v-show="!timeLine.disableStretch && !disableStretch" class="vg-move-block" @mousedown="e => startTimeLineStretch(e, timeLine, row.id, 'right')"></div>
          <div v-for="timePoint in timeLine.timePointNodes?.filter((() => styleOption?.showTimePoints))"
               :key="timePoint.id"
               class="vg-time-line-normal-time-points"
               :style="{transform: `translate(${timePoint.translateX - timePointSize / 2 - 1}px, -50%)`, width: `${timePointSize}px`, height: `${timePointSize}px`}"
               @contextmenu.stop="e => onTimePointContextMenu(e, timeLine, timePoint, row.id)"
               @mousedown.stop="e => onTimePointMouseDown(e, timeLine, timePoint)">
            <component :is="timePointComp" v-if="timePoint.useTimePointComp" v-bind="timePoint.compParams"></component>
            <img v-else :src="timePoint.icon || timePointSvg" alt="">
          </div>
        </div>
        <div v-if="timeLine.type === 'parentTimeLineNode'" class="vg-time-line-parentNode">
          <div class="vg-time-line-parentNode-bar"></div>
          <img class="vg-time-line-parentNode-triangle vg-time-line-parentNode-triangle-left" width="12" src="../../../../assets/images/BlackTriangle.svg">
          <img class="vg-time-line-parentNode-triangle vg-time-line-parentNode-triangle-right" width="12" src="../../../../assets/images/BlackTriangle.svg">
        </div>
        <div v-if="timeLine.type === 'sameDateTimeLineNode'" class="vg-time-line-sameNode"></div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, inject, Ref, computed, watch, toRef } from 'vue';
import dayjs from 'dayjs';
import { GanttRowNode, VisibleTimeLine, GanttStyleOption } from '@/types';
import minMax from 'dayjs/plugin/minMax';
import isBetween from 'dayjs/plugin/isBetween';
import { useTimeLine } from './useTimeLine';
import { useTimePoint, createTimePointNodes } from './useTimePoint';
import { useTimeLineStretch } from './useTimeLineStretch';
import { useTimeLineMove } from './useTimeLineMove';
import timePointSvg from '../../../../assets/images/timePoint.svg';

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
  styleOption?: GanttStyleOption,
  timePointComp?: any
}
console.log('ganttTimeLine');
const props = defineProps<Props>();

const emit = defineEmits<{
  (event: 'updateMinDate', date: dayjs.Dayjs): void,
  (event: 'updateMaxDate', date: dayjs.Dayjs): void,
}>();

const wrapRef = inject('wrapRef') as Ref<HTMLDivElement | undefined>;
const scrollViewScrollTop = ref(0);
const scrollViewScrollLeft = ref(0);
const currentVisibleRowIds = toRef(props, 'visibleRowIds');

const selectedRowIds = inject('selectedRowIds') as Ref<Set<string>>;
const timeLineMoving = ref(false);
const movingTimeLine: Ref<VisibleTimeLine | null> = ref(null);
const movingTimeLineRowId = ref('');
const perHourSpacingRef = toRef(props, 'perHourSpacing');
const ganttViewWidthRef = toRef(props, 'ganttViewWidth');
const rowHeightRef = toRef(props, 'rowHeight');
const rowNodeMapRef = toRef(props, 'rowNodeMap');
const timePointSize = computed(() => {
  return props.styleOption?.timePointSize || 28;
});

const disableStretch = computed(() => {
  return props.styleOption?.disableStretch;
});

const disableMove = computed(() => {
  return props.styleOption?.disableMove;
});

const getTimeLineBackgroundColor = (timeLine: VisibleTimeLine) => {
  return (timeLine.styleOption?.backgroundColor || props.styleOption?.barColor || '') as string;
};

const startInfo = computed(() => {
  const { perHourSpacing, edgeSpacing, ganttMinDate } = props;
  const diffHour = edgeSpacing / perHourSpacing;
  const startDate = ganttMinDate.subtract(diffHour, 'hour');

  return {
    startDate,
  };
});

const onScroll = ({ scrollTop, scrollLeft }: {scrollTop: number, scrollLeft: number}) => {
  scrollViewScrollTop.value = scrollTop;
  scrollViewScrollLeft.value = scrollLeft;
};

const onResize = () => {
  freshTimeLineView();

};

const emitUpdateMinDate = (date: dayjs.Dayjs) => {
  emit('updateMinDate', date);
};

const emitUpdateMaxDate = (date: dayjs.Dayjs) => {
  emit('updateMaxDate', date);
};

const getDiffSecondByDistance = (distance: number, startDate: dayjs.Dayjs) => {
  const { perHourSpacing } = props;

  const diffSecond = distance / perHourSpacing * 60 * 60;
  return startDate.add(diffSecond, 'second');
};

const closeEdgeScroll = (perMoveSpacing: number, callBack: (moveSpacing: number) => any) => {
  if (timeLineMoving.value) {
    wrapRef.value!.scrollLeft += perMoveSpacing;
    callBack(perMoveSpacing);
    requestAnimationFrame(() => {
      closeEdgeScroll(perMoveSpacing, callBack);
    });
  }
};

const {
  freshTimeLineView,
  freshTimeLineViewAfterScrollTop,
  freshTimeLines,
  freshVisibleTimeLines,
  sortTimeLineNodes,
  mergeOverlapTimeLine,
  visibleTimeLineMap,
  visibleRows,
  updateParentTimeLine
} = useTimeLine({
  rowHeight: rowHeightRef,
  rowBuffer: props.rowBuffer,
  perHourSpacing: perHourSpacingRef,
  scrollViewScrollTop,
  scrollViewScrollLeft,
  rowNodeMap: rowNodeMapRef,
  currentVisibleRowIds,
  startInfo,
  movingTimeLineRowId,
  movingTimeLine,
  createTimePointNodes
});

watch([currentVisibleRowIds, scrollViewScrollTop], freshTimeLineViewAfterScrollTop);
watch([startInfo, scrollViewScrollLeft], () => freshVisibleTimeLines(true));

const {
  onTimePointContextMenu,
  onTimePointMouseDown
} = useTimePoint({
  timePointSize,
  perHourSpacing: perHourSpacingRef,
  rowNodeMap: rowNodeMapRef,
  visibleTimeLineMap
});

const { startTimeLineStretch } = useTimeLineStretch({
  edgeSpacing: props.edgeSpacing,
  ganttViewWidth: ganttViewWidthRef,
  rowNodeMap: rowNodeMapRef,
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
});

const { startTimeLineMove } = useTimeLineMove({
  edgeSpacing: props.edgeSpacing,
  ganttViewWidth: ganttViewWidthRef,
  rowNodeMap: rowNodeMapRef,
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
});

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
  font-size: 16px;
  .vg-time-line-row {
    position: absolute;
    width: 100%;
    &.vg-selected-row {
      background-color: #0078d7;
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
        border-radius: 6px;
        border: 1px solid #000;
        background: #fff;
        cursor: grab;
        &.moving {
          cursor: grabbing;
        }
        &.disabledMove {
          cursor: default;
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
          height: 5px;
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