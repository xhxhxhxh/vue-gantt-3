<template>
  <div ref="ganttRightGantt" class="vg-right-gantt">
    <GanttHeader
      ref="ganttHeaderRef"
      :edgeSpacing="edgeSpacing"
      :perHourSpacing="perHourSpacing"
      :ganttMinDate="ganttMinDate"
      :ganttViewWidth="ganttViewWidth"
      :headerHeight="headerHeight"
    ></GanttHeader>
    <ScrollBar ref="scrollBarRef"
               :intercept-shift-scroll="true"
               :alwayHorizontal="true"
               @scroll="onScroll"
               @wheel.prevent="onWheel"
               @resize="onResize"
               @shift-scroll.prevent="onShiftScroll"
               @vertical-scroll-bar-show="onVerticalScrollBarShow">
      <GanttBody
        ref="ganttBodyRef"
        :rows="rows"
        :rowNodeMap="rowNodeMap"
        :rowHeight="rowHeight"
        :edgeSpacing="edgeSpacing"
        :perHourSpacing="perHourSpacing"
        :ganttMinDate="ganttMinDate"
        :ganttMaxDate="ganttMaxDate"
        :rowBuffer="rowBuffer"
        :ganttViewWidth="ganttViewWidth"
        :visibleRowIds="visibleRowIds"
        :styleOption="styleOption"
        :timePointComp="timePointComp"
      ></GanttBody>
    </ScrollBar>
  </div>
</template>
<script lang="ts" setup>
import ScrollBar from './scrollbar/ScrollBar.vue';
import GanttHeader from './GanttHeader.vue';
import type { RowData, ColumnData, DefaultCol, GanttRowNode, MGanttStyleOption } from '../types';
import dayjs from 'dayjs';
import { ref, onBeforeMount, computed, onMounted, onBeforeUnmount, watch, shallowRef, inject, toRef } from 'vue';
import minMax from 'dayjs/plugin/minMax';
import GanttBody from './ganttBody/GanttBody.vue';
import { getRound } from '@/utils/common';

dayjs.extend(minMax);

export interface Props {
  getRowId: (rowData: RowData) => string,
  columns: ColumnData[],
  rows: RowData[],
  defaultCol?: DefaultCol,
  rowHeight: number,
  headerHeight: number,
  rowBuffer: number,
  rowSelection: 'single' | 'multiple',
  rowNodeMap: Map<string, GanttRowNode>,
  firstLevelRowNode: GanttRowNode[],
  visibleRowIds: string[],
  defaultPerHourSpacing?: number,
  styleOption?: MGanttStyleOption,
  timePointComp?: any
}
console.log('RightGantt');
const props = withDefaults(defineProps<Props>(), {
  defaultPerHourSpacing: 0.1
});

const emit = defineEmits<{
  (event: 'triggerLeftTableScroll', options: ScrollToOptions, triggerScrollBar?: boolean): void,
  (event: 'ganttBodyResize', target: HTMLDivElement): void,
  (event: 'perHourSpacingChange', perHourSpacing: number): void,
}>();

const ganttMinDate = ref<dayjs.Dayjs>(dayjs());
const ganttMaxDate = ref<dayjs.Dayjs | null>(null);

const edgeSpacing = ref(20); // 时间线与显示区域边界的保持20px的间距
const perHourSpacing = ref(props.defaultPerHourSpacing); // 每个小时之间的间距
const ganttBodyRef = ref<InstanceType<typeof GanttBody>>();
const ganttHeaderRef = ref<InstanceType<typeof GanttHeader>>();
const scrollBarRef = ref<InstanceType<typeof ScrollBar>>();
const ganttRightGantt = ref<HTMLDivElement>();
const verticalScrollThumb = ref<HTMLDivElement>();
const perHourSpacingScale = 1.2;
const minPerHourSpacing = ref(0.007);
const maxPerHourSpacing = ref(1400);
const ganttViewWidth = ref(0);
const scrollFromLeftTable = ref(false);

onBeforeMount(() => {
  updateMinAndMaxDate();
  updateGanttViewWidth();
});

onMounted(() => {
  verticalScrollThumb.value = scrollBarRef.value?.$el.querySelector('.m-scrollbar-thumb-wrap.is-vertical') as HTMLDivElement;
});

watch(() => props.defaultPerHourSpacing, (val) => {
  perHourSpacing.value = val;
});

const updateMinAndMaxDate = () => {
  console.time('getMinAndMaxDate');
  const { minStartDate, maxEndDate } = getMinAndMaxDate(props.firstLevelRowNode);
  console.timeEnd('getMinAndMaxDate');
  if (minStartDate) {
    ganttMinDate.value = minStartDate;
  }
  if (maxEndDate) {
    ganttMaxDate.value = maxEndDate;
  }
  console.log('min, max date', ganttMinDate.value, ganttMaxDate.value);
};

const updateGanttViewWidth = () => {
  const diffHour = ganttMaxDate.value?.diff(ganttMinDate.value, 'hour', true) || 0;
  if (diffHour > 0) {
    ganttViewWidth.value = getRound(diffHour * perHourSpacing.value + edgeSpacing.value * 2);
  }

  // 设置maxPerHourSpacing， 浏览器最大支持16777200宽度显示
  maxPerHourSpacing.value = Math.floor((16777200 - edgeSpacing.value * 2) / diffHour);
};

watch([perHourSpacing, ganttMinDate, ganttMaxDate, edgeSpacing], updateGanttViewWidth);

const getMinAndMaxDate = (expectRowNodes: GanttRowNode[], freshStartDate = true, freshEndDate = true) => {
  const startDateArr: dayjs.Dayjs[] = [];
  const endDateArr: dayjs.Dayjs[] = [];

  if (freshStartDate) {
    for (let rowNode of expectRowNodes) {
      rowNode.startDate && startDateArr.push(rowNode.startDate);
    }
  }

  if (freshEndDate) {
    for (let rowNode of expectRowNodes) {
      rowNode.endDate && endDateArr.push(rowNode.endDate);
    }
  }

  return {
    minStartDate: dayjs.min(startDateArr),
    maxEndDate: dayjs.max(endDateArr)
  };
};

// addedRowNodes中都是最新数据，deletedRowNodes都是旧数据，updatedRowNodes包含新旧数据
const updateMinAndMaxDateByChangeRowNode = ({ addedRowNodes = [], deletedRowNodes = [], updatedRowNodes = [] }:
{addedRowNodes?: GanttRowNode[], deletedRowNodes?: GanttRowNode[], updatedRowNodes?: GanttRowNode[]}, freshRowNodes: GanttRowNode[]) => {
  let freshStartDate = false;
  let freshEndDate = false;
  // updatedRowNodes其实就是先删除旧数据，再新增新数据
  for (let updatedRowNode of updatedRowNodes) {
    addedRowNodes.push({
      ...updatedRowNode,
    });
    const oldStartDate = updatedRowNode.oldStartDate;
    const oldEndDate = updatedRowNode.oldEndDate;
    deletedRowNodes.push({
      ...updatedRowNode,
      startDate: oldStartDate!,
      endDate: oldEndDate!
    });
  }

  for (let deletedRowNode of deletedRowNodes) {
    if (!freshStartDate && deletedRowNode.startDate?.isSame(ganttMinDate.value)) {
      freshStartDate = true;
    }
    if (!freshEndDate && deletedRowNode.endDate?.isSame(ganttMaxDate.value)) {
      freshEndDate = true;
    }
  }

  if (freshStartDate || freshEndDate) {
    const { minStartDate, maxEndDate } = getMinAndMaxDate(freshRowNodes, freshStartDate, freshEndDate);
    if (minStartDate) {
      ganttMinDate.value = minStartDate;
    }
    if (maxEndDate) {
      ganttMaxDate.value = maxEndDate;
    }
  }

  for (let addedRowNode of addedRowNodes) {
    if (addedRowNode.startDate && addedRowNode.startDate.isBefore(ganttMinDate.value)) {
      ganttMinDate.value = addedRowNode.startDate;
    }
    if (addedRowNode.endDate && (!ganttMaxDate.value || addedRowNode.endDate.isAfter(ganttMaxDate.value))) {
      ganttMaxDate.value = addedRowNode.endDate;
    }
  }

};

const onScroll = ({ scrollTop, scrollLeft }: {scrollTop: number, scrollLeft: number}) => {
  if (scrollFromLeftTable.value) {
    scrollFromLeftTable.value = false;
  } else {
    emit('triggerLeftTableScroll', { top: scrollTop });
  }
  if (ganttBodyRef.value) {
    ganttBodyRef.value.onScroll({ scrollTop, scrollLeft });
  }
  if (ganttHeaderRef.value) {
    ganttHeaderRef.value.onScroll({ scrollLeft });
  }
};

const onWheel = (e: WheelEvent) => {
  if (!verticalScrollThumb.value) return;
  if (Math.abs(e.deltaY) < 3) return; // 防止笔记本触摸板一直滚动
  const scrollSpeed = 100;
  const scrollDistance = e.deltaY > 0 ? scrollSpeed : -scrollSpeed;
  const scrollTop = verticalScrollThumb.value?.scrollTop + scrollDistance;
  verticalScrollThumb.value?.scrollTo({ top: scrollTop });
  scrollFromLeftTable.value = true;
  emit('triggerLeftTableScroll', { top: scrollTop }, true);
};

const onResize = (target: HTMLDivElement) => {
  if (ganttBodyRef.value) {
    ganttBodyRef.value.onResize(target);
  }
  if (ganttHeaderRef.value) {
    ganttHeaderRef.value.onResize(target);
  }
  emit('ganttBodyResize', target);
};

const onShiftScroll = (e: WheelEvent) => {
  if (Math.abs(e.deltaY) < 3) return;
  if (e.deltaY > 0) {
    const newPerHourSpacing = perHourSpacing.value / perHourSpacingScale;
    perHourSpacing.value = Math.max(newPerHourSpacing, minPerHourSpacing.value);
  } else if (e.deltaY < 0) {
    const newPerHourSpacing = perHourSpacing.value * perHourSpacingScale;
    perHourSpacing.value = Math.min(newPerHourSpacing, maxPerHourSpacing.value);
  }
  emit('perHourSpacingChange', perHourSpacing.value);
};

const onVerticalScrollBarShow = ({ show, scrollbarWidth }: {show: boolean, scrollbarWidth: number}) => {
  if (ganttHeaderRef.value) {
    ganttHeaderRef.value.updateGanttHeaderWidth(show, scrollbarWidth);
  }
};

const scrollTo = (options: ScrollToOptions) => {
  scrollFromLeftTable.value = true;
  // 此处需要使用triggerScrollFromOutSide，防止lefttable滚动过快导致timelineview白屏
  scrollBarRef.value?.triggerScrollFromOutSide(options);
};

const freshTimeLines = (rowNodes: GanttRowNode[]) => {
  if (ganttBodyRef.value) {
    ganttBodyRef.value.freshTimeLines(rowNodes);
  }
};

defineExpose({
  scrollTo,
  updateMinAndMaxDateByChangeRowNode,
  freshTimeLines
});

</script>
<style lang="scss">
.vg-right-gantt {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  .m-scrollbar {
    flex: 1;
  }
}
</style>