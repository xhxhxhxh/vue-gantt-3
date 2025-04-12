<template>
  <div class="vg-time-line-render">
    <div class="vg-time-line-process" @mousedown.stop="e => onMouseDown(e)">
      <div class="vg-time-line-process-bar" :style="{width: `${barWidth}px`}"></div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, watch } from "vue";
import { VisibleTimeLine, GanttRowNode } from 'vue-gantt-3/types';
import { Row, TimeLine } from '../types';
import dayjs, { Dayjs } from 'dayjs';
import minMax from 'dayjs/plugin/minMax';

dayjs.extend(minMax);

const props = defineProps<{
  params?: Record<string, any>,
  visibleTimeLine: VisibleTimeLine,
  rowNode: GanttRowNode<Row>,
  timeLineWidth: number
}>();

const barWidth = ref(0);

const onMouseDown = (e: MouseEvent) => {
  e.stopPropagation();
  const startClientX = e.clientX;
  const startOffsetX = e.offsetX;
  handleMouseEvent(startOffsetX)
  const onMouseMove = (e: MouseEvent) => {
    handleMouseEvent(startOffsetX + e.clientX - startClientX)
  
  }
  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}


const handleMouseEvent = (offsetX: number) => {
  const { width, timeLineNode } = props.visibleTimeLine;
  const timeLineRenderParams = props.params;
  const rowNode = props.rowNode;
  barWidth.value = Math.min(offsetX, width);
  const diffSeconds = timeLineNode.endDate.diff(timeLineNode.startDate, 'second', true);
  const addedSeconds = barWidth.value / width * diffSeconds;
  const currentDate = timeLineNode.startDate.add(addedSeconds, 'second')
  const dateObj: Record<string, Dayjs> = {};
  if (timeLineNode.isMerge) {
    const mergedTimeLineNodes = timeLineNode.mergedTimeLineNodes || [];
    mergedTimeLineNodes.forEach((node) => {
      const timeLineData = node.data as TimeLine;
      if (timeLineData) {
        const actualDate = timeLineData.actualDate ? dayjs(timeLineData.actualDate) : null;
        if (!currentDate.isSame(actualDate)) {
          if (currentDate.isAfter(node.endDate)) {
            dateObj[node.id] = node.endDate;
          } else if (currentDate.isBefore(node.startDate)) {
            dateObj[node.id] = node.startDate;
          } else {
            dateObj[node.id] = currentDate;
          }
        }
      }
    });
  } else {
    dateObj[timeLineNode.id] = currentDate;
  }
  timeLineRenderParams?.onActualDateChange && timeLineRenderParams.onActualDateChange(rowNode.data, dateObj);
}

watch([() => props.timeLineWidth, () => props.visibleTimeLine.timeLineNode.mergedTimeLineNodes?.length], () => {
  const { width, timeLineNode } = props.visibleTimeLine;
  const { startDate, endDate, isMerge, data: timeLineData } = timeLineNode;
  let maxActualDate: Dayjs | null = null;
  if (isMerge) {
    const mergedTimeLineNodes = timeLineNode.mergedTimeLineNodes || [];
    const actualDateArr: Dayjs[] = [];
    mergedTimeLineNodes.forEach((node) => {
      const timeLineData = node.data as TimeLine;
      if (timeLineData) {
        const actualDate = timeLineData.actualDate ? dayjs(timeLineData.actualDate) : null;
        if (actualDate) {
          actualDateArr.push(actualDate);
        }
      }
    });
    maxActualDate = dayjs.max(actualDateArr);
  } else {
    const actualDate = (timeLineData as TimeLine ).actualDate
    maxActualDate = actualDate ? dayjs(actualDate) : null;
  }
  if (maxActualDate) {
    const diffSeconds = endDate.diff(startDate, 'second', true);
    const addedSeconds = maxActualDate.diff(startDate, 'second', true);
    const offsetX = (addedSeconds / diffSeconds) * width;
    barWidth.value = Math.min(offsetX, width);
  }
}, { immediate: true });

</script>
<style lang="scss">
.vg-time-line-render {
  height: 16px;
  border-radius: 6px;
  border: 1px solid #000;
  background: #fff;
  position: relative;
  .vg-time-line-process {
    height: 4px;
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    width: 100%;
    cursor: col-resize;
    .vg-time-line-process-bar {
      background-color: orange;
      height: 100%;
    }
  }
}
</style>