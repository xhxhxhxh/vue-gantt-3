<template>
  <svg class="vg-grid-container">
    <g stroke-width="1"
       stroke="#e9e9e9"
       stroke-dasharray="12, 8"
       transform="translate(-0.5,-0.5)">
      <line v-for="position in verticalLinesList"
            :key="position"
            :x1="position"
            y1="0"
            :x2="position"
            y2="100%"/>
    </g>
    <g stroke-width="1" stroke="#e9e9e9" transform="translate(-0.5,-0.5)">
      <line v-for="position in horizontalLinesList"
            :key="position"
            x1="0"
            :y1="position"
            x2="100%"
            :y2="position"/>
    </g>
  </svg>
</template>
<script lang="ts" setup>
import { GanttStyleOption, GanttBodyStartInfo } from '@/types';
import { ref, inject, Ref, computed, watch, toRef } from 'vue';
import { getRound } from '@/utils/common';
import dayjs from 'dayjs';

export interface Props {
  rowHeight: number,
  perHourSpacing: number,
  rowBuffer: number,
  edgeSpacing: number,
  ganttMinDate: dayjs.Dayjs,
  styleOption?: GanttStyleOption
}
console.log('ganttGrid');
const props = defineProps<Props>();

const wrapRef = inject('wrapRef') as Ref<HTMLDivElement | undefined>;
const verticalLinesList = ref<number[]>([]);
const horizontalLinesList = ref<number[]>([]);

const scrollViewScrollTop = ref(0);
const scrollViewScrollLeft = ref(0);
const bufferWidth = 200;
const styleOption = toRef(props, 'styleOption');

const showHorizontalGridLines = computed(() => {
  return styleOption.value?.showHorizontalGridLines;
});

const freshGrid = () => {
  console.log('freshGrid');
  console.time('freshGrid');
  freshVerticalLines();
  freshHorizontalLines();
  console.timeEnd('freshGrid');
};

// get the left position of the first month vertical line
const startInfo = computed<GanttBodyStartInfo>(() => {
  const { perHourSpacing, edgeSpacing, ganttMinDate } = props;
  const diffHour = edgeSpacing / perHourSpacing;
  const startDate = ganttMinDate.subtract(diffHour, 'hour');
  const endDate = startDate.endOf('month');
  const diff = endDate.diff(startDate, 'hour', true);
  const startLeft = diff * perHourSpacing;

  return {
    startLeft,
    startMonthDate: endDate,
  };
});

const freshVerticalLines = () => {
  if (!wrapRef.value) return;
  console.log('freshVerticalLines');

  const wrapWidth = wrapRef.value.offsetWidth;
  const { perHourSpacing } = props;

  const { startMonthDate, startLeft } = startInfo.value;

  const startLeftInView = scrollViewScrollLeft.value - bufferWidth;
  const endLeftInView = scrollViewScrollLeft.value + wrapWidth + bufferWidth;

  const newVerticalLinesList: number[] = [];
  let start = startLeft;
  let startMonthDateInView = startMonthDate;

  if (startLeftInView > startLeft) {
    const diffHour = (startLeftInView - startLeft) / perHourSpacing;
    const startDateInView = startMonthDate.add(diffHour, 'hour');
    const endMonthDate = startDateInView.endOf('month');
    const diff = endMonthDate.diff(startMonthDate, 'hour', true);
    start = startLeft + diff * perHourSpacing;
    startMonthDateInView = endMonthDate;

  }

  const perDaySpacing = perHourSpacing * 24;
  let nextStartMonthDateInView = startMonthDateInView;

  while (start <= endLeftInView) {
    newVerticalLinesList.push(getRound(start));
    nextStartMonthDateInView = nextStartMonthDateInView.add(1, 'month');
    const nextMonthDays = nextStartMonthDateInView.daysInMonth();
    start += nextMonthDays * perDaySpacing;
  }

  verticalLinesList.value = newVerticalLinesList;
};

const freshHorizontalLines = () => {
  if (!wrapRef.value) return;
  console.log('freshHorizontalLines');

  if (!showHorizontalGridLines.value) {
    horizontalLinesList.value = [];
    return;
  }
  const { rowHeight, rowBuffer } = props;
  const wrapHeight = wrapRef.value.offsetHeight;
  const bufferHeight = rowHeight * rowBuffer;
  const startNumInView = Math.ceil((scrollViewScrollTop.value - bufferHeight) / rowHeight);
  const endIdNumView = Math.floor((scrollViewScrollTop.value + wrapHeight + bufferHeight) / rowHeight);

  const newHorizontalLinesList: number[] = [];
  const start = Math.max(1, startNumInView);
  for (let i = start; i <= endIdNumView + 1; i++) {
    newHorizontalLinesList.push(i * rowHeight);
  }

  horizontalLinesList.value = newHorizontalLinesList;

};

watch([startInfo, scrollViewScrollLeft], freshVerticalLines);
watch([scrollViewScrollTop, showHorizontalGridLines], freshHorizontalLines);

const onScroll = ({ scrollTop, scrollLeft }: {scrollTop: number, scrollLeft: number}) => {
  scrollViewScrollTop.value = scrollTop;
  scrollViewScrollLeft.value = scrollLeft;
};

const onResize = () => {
  freshGrid();

};

defineExpose({
  onScroll,
  onResize
});

</script>
<style lang="scss">
.vg-grid-container {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>