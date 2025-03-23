<template>
  <div ref="ganttGanttView" class="vg-gantt-view">
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
        @update-min-date="updateMinDate"
        @update-max-date="updateMaxDate"
      ></GanttBody>
    </ScrollBar>
  </div>
</template>
<script lang="ts" setup>
import ScrollBar from '../scrollbar/ScrollBar.vue';
import GanttHeader from './ganttHeader/GanttHeader.vue';
import type { RowData, ColDef, DefaultColDef, GanttRowNode, GanttStyleOption } from '@/types';
import dayjs from 'dayjs';
import { ref, onBeforeMount, computed, onMounted, onBeforeUnmount, watch, shallowRef, inject, toRef, provide } from 'vue';
import minMax from 'dayjs/plugin/minMax';
import GanttBody from './ganttBody/GanttBody.vue';
import { getRound, treeForEach } from '@/utils/common';

dayjs.extend(minMax);

export interface Props {
  getRowId: (rowData: RowData) => string,
  columns: ColDef[],
  rows: RowData[],
  defaultCol?: DefaultColDef,
  rowHeight: number,
  headerHeight: number,
  rowBuffer: number,
  rowSelection: 'single' | 'multiple',
  rowNodeMap: Map<string, GanttRowNode>,
  firstLevelRowNode: GanttRowNode[],
  visibleRowIds: string[],
  defaultPerHourSpacing?: number,
  styleOption?: GanttStyleOption,
  timePointComp?: any
}
console.log('GanttView');
const props = withDefaults(defineProps<Props>(), {
  defaultPerHourSpacing: 0.1
});

const emit = defineEmits<{
  (event: 'triggerTableViewScroll', options: ScrollToOptions, onWheel?: boolean): void,
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
const ganttGanttView = ref<HTMLDivElement>();
const scrollbarWrap = ref<HTMLDivElement>();

const perHourSpacingScale = 1.2;
const minPerHourSpacing = ref(0.007);
const maxPerHourSpacing = ref(1400);
const ganttViewWidth = ref(0);
const scrollFromTableView = ref(false);

onBeforeMount(() => {
  updateMinAndMaxDate();
  updateGanttViewWidth();
});

onMounted(() => {
  scrollbarWrap.value = scrollBarRef.value?.$el.querySelector('.m-scrollbar-wrap') as HTMLDivElement;
});

watch(() => props.defaultPerHourSpacing, (val) => {
  perHourSpacing.value = val;
});

const getTopLevelRow = inject('getTopLevelRow') as (rowId: string, currentRowNodeMap: Map<string, GanttRowNode>) => GanttRowNode;

const getGanttMinAndMaxDate = (excludeRowIds: string[] = [], freshStartDate = true, freshEndDate = true) => {
  const excludeRowIdSet = new Set(excludeRowIds);
  const excludeFirstLevelRowId = excludeRowIds.map((rowId) => getTopLevelRow(rowId, props.rowNodeMap).id);
  const excludeFirstLevelRowIdSet = new Set(excludeFirstLevelRowId);
  const needFirstLevelRowNode: GanttRowNode[] = [];
  const excludeFirstLevelRowNode: GanttRowNode[] = [];
  for (let rowNode of props.firstLevelRowNode) {
    if (excludeFirstLevelRowIdSet.has(rowNode.id)) {
      excludeFirstLevelRowNode.push(rowNode);
    } else {
      needFirstLevelRowNode.push(rowNode);
    }
  }

  const { minStartDate, maxEndDate } = getMinAndMaxDate(needFirstLevelRowNode, freshStartDate, freshEndDate);
  let allMinStartDates: dayjs.Dayjs[] = [];
  let allMaxEndDates: dayjs.Dayjs[] = [];

  if (minStartDate) {
    allMinStartDates.push(minStartDate);
  }
  if (maxEndDate) {
    allMaxEndDates.push(maxEndDate);
  }

  treeForEach(excludeFirstLevelRowNode, (rowNode) => {
    if (!rowNode.hasChildren && !excludeRowIdSet.has(rowNode.id)) {
      rowNode.startDate && allMinStartDates.push(rowNode.startDate);
      rowNode.endDate && allMaxEndDates.push(rowNode.endDate);
    }
  });
  return {
    minStartDate: dayjs.min(allMinStartDates),
    maxEndDate: dayjs.max(allMaxEndDates)
  };
};

provide(
  'getGanttMinAndMaxDate',
  getGanttMinAndMaxDate
);

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

const updateMinDate = (minDate: dayjs.Dayjs) => {
  ganttMinDate.value = minDate;
};

const updateMaxDate = (maxDate: dayjs.Dayjs) => {
  ganttMaxDate.value = maxDate;
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
  if (scrollFromTableView.value) {
    scrollFromTableView.value = false;
  } else {
    emit('triggerTableViewScroll', { top: scrollTop });
  }
  if (ganttBodyRef.value) {
    ganttBodyRef.value.onScroll({ scrollTop, scrollLeft });
  }
  if (ganttHeaderRef.value) {
    ganttHeaderRef.value.onScroll({ scrollLeft });
  }
};

const onWheel = (e: WheelEvent) => {
  if (!scrollbarWrap.value) return;
  if (Math.abs(e.deltaY) < 3) return; // 防止笔记本触摸板一直滚动
  const scrollSpeed = 100;
  const scrollDistance = e.deltaY > 0 ? scrollSpeed : -scrollSpeed;
  const scrollTop = scrollbarWrap.value?.scrollTop + scrollDistance;
  scrollBarRef.value?.triggerScrollFromOutSide({ top: scrollTop });
  scrollFromTableView.value = true;
  emit('triggerTableViewScroll', { top: scrollTop }, true);
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
  scrollFromTableView.value = true;
  // 此处需要使用triggerScrollFromOutSide，防止tableView滚动过快导致timelineview白屏
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
.vg-gantt-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  .m-scrollbar {
    flex: 1;
  }
}
</style>