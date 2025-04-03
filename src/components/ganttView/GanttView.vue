<template>
  <div ref="ganttGanttView" class="vg-gantt-view">
    <GanttHeader
      ref="ganttHeaderRef"
      :edgeSpacing="edgeSpacing"
      :perHourSpacing="perHourSpacing"
      :ganttMinDate="ganttMinDate"
      :ganttViewWidth="ganttViewWidth"
      :headerHeight="headerHeight"
      :locale="locale"
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
import type { RowData, ColDef, DefaultColDef, GanttRowNode, GanttStyleOption, TimeScale } from '@/types';
import dayjs from 'dayjs';
import { ref, onBeforeMount, onMounted, watch, inject, provide } from 'vue';
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
  rowNodeMap: Map<string, GanttRowNode>,
  firstLevelRowNode: GanttRowNode[],
  visibleRowIds: string[],
  defaultPerHourSpacing?: number,
  defaultTimeScale?: TimeScale,
  styleOption?: GanttStyleOption,
  timePointComp?: any,
  locale?: string
}

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

const edgeSpacing = ref(20); // Keep a 20px gap between the timeline and the display edge
const perHourSpacing = ref(props.defaultPerHourSpacing);
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
const maxAndMindateCache = new Map<string, dayjs.Dayjs>();

onBeforeMount(() => {
  updateMinAndMaxDate();
  updateGanttViewWidth();
});

onMounted(() => {
  scrollbarWrap.value = scrollBarRef.value?.$el.querySelector('.vg-scrollbar-wrap') as HTMLDivElement;
});

watch([() => props.defaultPerHourSpacing, () => props.defaultTimeScale], ([currentPerHourSpacing, currentTimeScale]) => {
  if (currentTimeScale) {
    switch (currentTimeScale) {
      case 'day':
        perHourSpacing.value = 2;
        break;
      case 'week':
        perHourSpacing.value = 0.6;
        break;
      case 'month':
        perHourSpacing.value = 0.1;
        break;
      case 'quarter':
        perHourSpacing.value = 0.05;
        break;
      case 'year':
        perHourSpacing.value = 0.02;
        break;
      default:
        break;
    }
  } else {
    perHourSpacing.value = currentPerHourSpacing;
  }
}, { immediate: true });

const getTopLevelRow = inject('getTopLevelRow') as (rowId: string, currentRowNodeMap: Map<string, GanttRowNode>) => GanttRowNode;

/**
 * calculate the min and max date of the gantt
 * @param excludeRowIds
 * @param freshStartDate
 * @param freshEndDate
 */
const getGanttMinAndMaxDate = (excludeRowIds: string[] = [], freshStartDate = true, freshEndDate = true) => {
  const isSingleExclude = excludeRowIds.length === 1;
  if (isSingleExclude) {
    if (maxAndMindateCache.has('minStartDate') && maxAndMindateCache.has('maxEndDate')) {
      return {
        minStartDate: maxAndMindateCache.get('minStartDate'),
        maxEndDate: maxAndMindateCache.get('maxEndDate')
      };
    }
  }
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

  const finalMinStartDate = dayjs.min(allMinStartDates);
  const finalMaxEndDate = dayjs.max(allMaxEndDates);
  if (isSingleExclude && finalMinStartDate && finalMaxEndDate) {
    maxAndMindateCache.set('minStartDate', finalMinStartDate);
    maxAndMindateCache.set('maxEndDate', finalMaxEndDate);
  }
  return {
    minStartDate: finalMinStartDate,
    maxEndDate: finalMaxEndDate
  };
};

provide(
  'getGanttMinAndMaxDate',
  getGanttMinAndMaxDate
);

const clearDateCache = () => {
  maxAndMindateCache.clear();
};

provide(
  'clearDateCache',
  clearDateCache
);

const updateMinAndMaxDate = () => {
  const { minStartDate, maxEndDate } = getMinAndMaxDate(props.firstLevelRowNode);
  if (minStartDate) {
    ganttMinDate.value = minStartDate;
  }
  if (maxEndDate) {
    ganttMaxDate.value = maxEndDate;
  }
};

const updateMinDate = (minDate: dayjs.Dayjs) => {
  ganttMinDate.value = minDate;
};

const updateMaxDate = (maxDate: dayjs.Dayjs) => {
  ganttMaxDate.value = maxDate;
};

/**
 * calculate the width of the gantt by the min and max date
 */
const updateGanttViewWidth = () => {
  const diffHour = ganttMaxDate.value?.diff(ganttMinDate.value, 'hour', true) || 0;
  if (diffHour > 0) {
    ganttViewWidth.value = getRound(diffHour * perHourSpacing.value + edgeSpacing.value * 2);
  }

  // browser max width is 16777200
  maxPerHourSpacing.value = Math.floor((16777200 - edgeSpacing.value * 2) / diffHour);
};

watch([perHourSpacing, ganttMinDate, ganttMaxDate, edgeSpacing], updateGanttViewWidth);

/**
 * calculate the min and max date from the rowNodes
 * @param expectRowNodes
 * @param freshStartDate
 * @param freshEndDate
 */
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

/**
 * trigger when rowNode change
 * @param param0 addedRowNodes is new, deletedRowNodes is old, updatedRowNodes include new and old
 * @param freshRowNodes
 */
const updateMinAndMaxDateByChangeRowNode = ({ addedRowNodes = [], deletedRowNodes = [], updatedRowNodes = [] }:
{addedRowNodes?: GanttRowNode[], deletedRowNodes?: GanttRowNode[], updatedRowNodes?: GanttRowNode[]}, freshRowNodes: GanttRowNode[]) => {
  let freshStartDate = false;
  let freshEndDate = false;
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
  if (Math.abs(e.deltaY) < 3) return; // prevent the touchpad from scrolling continuously
  const scrollSpeed = 100;
  const scrollDistance = e.deltaY > 0 ? scrollSpeed : -scrollSpeed;
  const scrollTop = scrollbarWrap.value?.scrollTop + scrollDistance;
  scrollBarRef.value?.triggerScrollFromOutSide({ top: scrollTop });
  scrollFromTableView.value = true;
  emit('triggerTableViewScroll', { top: scrollTop }, true);
};

const onResize = (target: HTMLDivElement) => {
  if (ganttBodyRef.value) {
    ganttBodyRef.value.onResize();
  }
  if (ganttHeaderRef.value) {
    ganttHeaderRef.value.onResize();
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
  // use triggerScrollFromOutSide to prevent the tableView from scrolling too fast and causing the timelineView to white screen
  scrollBarRef.value?.triggerScrollFromOutSide(options);
};

/**
 * trigger by user to fresh time lines
 * @param rowNodes
 */
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
  .vg-scrollbar {
    flex: 1;
  }
}
</style>