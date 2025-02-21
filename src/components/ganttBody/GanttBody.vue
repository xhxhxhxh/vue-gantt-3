<template>
  <div class="m-gantt-body" :style="{height: ganttBodyHeight, width: ganttBodyWidth}">
    <GanttGrid
      ref="ganttGridRef"
      :rowHeight="rowHeight"
      :perHourSpacing="perHourSpacing"
      :rowBuffer="rowBuffer"
      :edgeSpacing="edgeSpacing"
      :ganttMinDate="ganttMinDate"
      :styleOption="styleOption"
    ></GanttGrid>
    <GanttTimeLineView
      ref="ganttTimeLineViewRef"
      :rowHeight="rowHeight"
      :perHourSpacing="perHourSpacing"
      :ganttMinDate="ganttMinDate"
      :rowBuffer="rowBuffer"
      :rowNodeMap="rowNodeMap"
      :visibleRowIds="visibleRowIds"
      :edgeSpacing="edgeSpacing"
      :styleOption="styleOption"
      :timePointComp="timePointComp"
    ></GanttTimeLineView>
  </div>
</template>
<script lang="ts" setup>
import dayjs from 'dayjs';
import { ref, inject, toRef, computed, watch } from 'vue';
import type { Ref } from 'vue';
import GanttGrid from './GanttGrid.vue';
import GanttTimeLineView from './GanttTimeLineView.vue';
import { RowData, GanttRowNode, MGanttStyleOption } from '@/types';

export interface Props {
  rowHeight: number,
  edgeSpacing: number,
  perHourSpacing: number,
  rowBuffer: number,
  ganttMinDate: dayjs.Dayjs,
  ganttViewWidth: number,
  rows: RowData[],
  rowNodeMap: Map<string, GanttRowNode>,
  visibleRowIds: string[],
  styleOption?: MGanttStyleOption,
  timePointComp?: any
}
console.log('ganttBody');
const props = defineProps<Props>();

const wrapRef = inject('wrapRef') as Ref<HTMLDivElement | undefined>;

const ganttGridRef = ref<InstanceType<typeof GanttGrid>>();
const ganttTimeLineViewRef = ref<InstanceType<typeof GanttTimeLineView>>();
const ganttViewWidth = toRef(props, 'ganttViewWidth');

const ganttBodyWidth = ref('');
const ganttBodyHeight = ref('');

const getGanttBodyWidth = () => {
  if (!wrapRef.value) {
    ganttBodyWidth.value = '100%';
    return;
  }
  const minWidth = wrapRef.value.offsetWidth as number;
  ganttBodyWidth.value = Math.max(minWidth, ganttViewWidth.value) + 'px';
};

const getGanttBodyHeight = () => {
  const { visibleRowIds, rowHeight } = props;
  const contentHeight = visibleRowIds.length * rowHeight as number;
  if (!wrapRef.value) {
    ganttBodyHeight.value = contentHeight + 'px';
  } else {
    const wrapHeight = wrapRef.value.offsetHeight as number;
    console.log('getGanttBodyHeight', contentHeight, wrapHeight);
    ganttBodyHeight.value = Math.max(contentHeight, wrapHeight) + 'px';
  }
};

watch(ganttViewWidth, () => {
  getGanttBodyWidth();
});

watch(() => props.visibleRowIds, () => {
  getGanttBodyHeight();
});

const onScroll = ({ scrollTop, scrollLeft }: {scrollTop: number, scrollLeft: number}) => {
  if (ganttGridRef.value) {
    ganttGridRef.value.onScroll({ scrollTop, scrollLeft });
  }
  if (ganttTimeLineViewRef.value) {
    ganttTimeLineViewRef.value.onScroll({ scrollTop, scrollLeft });
  }
};

const onResize = (target: HTMLDivElement) => {
  console.log('ganttbody resize');
  getGanttBodyWidth();
  getGanttBodyHeight();
  if (ganttGridRef.value) {
    ganttGridRef.value.onResize(target);
  }
  if (ganttTimeLineViewRef.value) {
    ganttTimeLineViewRef.value.onResize(target);
  }
};

const freshTimeLines = (rowNodes: GanttRowNode[]) => {
  if (ganttTimeLineViewRef.value) {
    ganttTimeLineViewRef.value.freshTimeLines(rowNodes);
  }
};

defineExpose({
  onResize,
  onScroll,
  freshTimeLines
});

</script>
<style lang="scss">
.m-gantt-body {
  position: relative;
}
</style>
