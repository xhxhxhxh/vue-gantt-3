<template>
  <div ref="ganttHeaderRef" class="vg-header">
    <div v-show="showFirstLevel || !showSecondLevel" class="vg-header-first-level " :style="{width: ganttHeaderLevelWidth, height: `${headerHeight + 1}px`}">
      <div v-for="item in firstLevelBlocks"
           :key="item.key"
           class="vg-header-block"
           :class="{'vg-header-block-hide-right-border': item.hideRightBorder}"
           :title="item.tip"
           :style="{width: item.width + 'px', left: item.left + 'px'}">
        <span class="vg-header-block-text">{{ item.text }}</span>
      </div>
    </div>
    <div v-show="showSecondLevel" class="vg-header-second-level" :style="{width: ganttHeaderLevelWidth, height: `${headerHeight + 1}px`}">
      <div v-for="item in secondLevelBlocks"
           :key="item.key"
           class="vg-header-block"
           :class="{'vg-header-block-hide-right-border': item.hideRightBorder}"
           :title="item.tip"
           :style="{width: item.width + 'px', left: item.left + 'px'}">
        <span class="vg-header-block-text">{{ item.text }}</span>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import dayjs from 'dayjs';
import { ref, inject, computed, watch, shallowRef } from 'vue';
import type { Ref } from 'vue';

import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import type { GanttHeaderUnit, BlockItem } from '@/types';
import { getRound } from '@/utils/common';
import lang from '@/locale';

dayjs.extend(quarterOfYear);

export interface Props {
  headerHeight: number,
  edgeSpacing: number,
  perHourSpacing: number,
  ganttMinDate: dayjs.Dayjs,
  ganttViewWidth: number,
  locale?: string
}

const props = defineProps<Props>();

const firstLevelBlocks = shallowRef<BlockItem[]>([]);
const secondLevelBlocks = shallowRef<BlockItem[]>([]);
const units: GanttHeaderUnit[] = ['hour', 'day', 'week', 'month', 'quarter', 'year'];
const scrollViewScrollLeft = ref(0);
const bufferWidth = 200;
const ganttHeaderRef = ref<HTMLDivElement>();
const scrollLeftOffset = ref(0);
const showSecondLevel = inject('showSecondLevel') as Ref<boolean>;
const showFirstLevel = inject('showFirstLevel') as Ref<boolean>;

const localeRef = computed(() => {
  if (props.locale) {
    return props.locale;
  } else {
    const language = navigator.language;
    if (language.startsWith('zh')) {
      return 'zh-cn';
    } else {
      return language;
    }
  }
});

const ganttHeaderLevelWidth = computed(() => {
  if (!ganttHeaderRef.value) return '100%';
  const minWidth = ganttHeaderRef.value.offsetWidth as number;
  return Math.max(minWidth, props.ganttViewWidth + scrollLeftOffset.value) + 'px';
});

const getUnit = computed(() => {
  const { perHourSpacing } = props;
  let firstLevelUnitIndex = 0;
  const perMonthSpacing = perHourSpacing * 24 * 30;
  let canShowSecondLevel = true;

  if (perMonthSpacing >= 30000) {
    firstLevelUnitIndex = units.indexOf('day');
  } else if (perMonthSpacing >= 800) {
    firstLevelUnitIndex = units.indexOf('week');
  } else if (perMonthSpacing >= 400) {
    firstLevelUnitIndex = units.indexOf('month');
  } else if (perMonthSpacing >= 40) {
    firstLevelUnitIndex = units.indexOf('quarter');
  } else if (perMonthSpacing >= 24) {
    firstLevelUnitIndex = units.indexOf('year');
  } else if (perMonthSpacing >= 5) {
    firstLevelUnitIndex = units.indexOf('year');
    canShowSecondLevel = false;
  }

  return {
    firstLevelUnit: units[firstLevelUnitIndex],
    secondLevelUnit: units[firstLevelUnitIndex - 1],
    canShowSecondLevel
  };
});

const startInfo = computed(() => {
  const { perHourSpacing, edgeSpacing, ganttMinDate } = props;
  const { firstLevelUnit, secondLevelUnit } = getUnit.value;
  const diffSpacing = edgeSpacing / perHourSpacing;
  const startDate = ganttMinDate.subtract(diffSpacing, 'hour');

  const firstLevelStartUnitDate = startDate.endOf(firstLevelUnit);
  const secondLevelStartUnitDate = startDate.endOf(secondLevelUnit);

  const firstLevelStartLeft = firstLevelStartUnitDate.diff(startDate, 'hour', true) * perHourSpacing;
  const secondLevelStartLeft = secondLevelStartUnitDate.diff(startDate, 'hour', true) * perHourSpacing;

  return {
    firstLevelStartUnitDate,
    secondLevelStartUnitDate,
    firstLevelStartLeft,
    secondLevelStartLeft
  };

});

const freshBlocks = () => {
  if (!ganttHeaderRef.value) return;
  const { firstLevelStartUnitDate, secondLevelStartUnitDate, firstLevelStartLeft, secondLevelStartLeft } = startInfo.value;

  const { firstLevelUnit, secondLevelUnit, canShowSecondLevel } = getUnit.value;

  // first header
  firstLevelBlocks.value = getNewBlocks(firstLevelStartLeft, firstLevelStartUnitDate, firstLevelUnit);

  // second header
  showSecondLevel.value = canShowSecondLevel;
  if (canShowSecondLevel) {
    secondLevelBlocks.value = getNewBlocks(secondLevelStartLeft, secondLevelStartUnitDate, secondLevelUnit);
  }
};

/**
 * calculate blocks' size by startLeft and startDate
 * @param startLeft
 * @param startDate
 * @param currentUnit
 */
const getNewBlocks = (startLeft: number, startDate: dayjs.Dayjs, currentUnit: GanttHeaderUnit) => {
  const ganttHeaderWidth = ganttHeaderRef.value!.offsetWidth;
  const startLeftInView = scrollViewScrollLeft.value - bufferWidth;
  const endLeftInView = scrollViewScrollLeft.value + ganttHeaderWidth + bufferWidth;
  const { perHourSpacing } = props;

  const newLevelBlocks: BlockItem[] = [];
  let levelStart = startLeft;
  let levelStartDateInView = startDate;
  if (startLeftInView > startLeft) {
    const diffHour = (startLeftInView - startLeft) / perHourSpacing;
    const startDateInView = startDate.add(diffHour, 'hour');
    const endDateInView = startDateInView.endOf(currentUnit);
    const diff = endDateInView.diff(startDate, 'hour', true);
    levelStart = startLeft + diff * perHourSpacing;
    levelStartDateInView = endDateInView;
  }

  let currentLevelStartDateInView = levelStartDateInView;
  const limitMinLeft = scrollViewScrollLeft.value;
  const limintMaxLeft = scrollViewScrollLeft.value + ganttHeaderWidth;
  let blockSpacing = getBlockSpacingByUnit(currentLevelStartDateInView, currentUnit);

  while ((levelStart - blockSpacing) <= endLeftInView) {
    let width = blockSpacing;
    let offset = width;
    let hideRightBorder = false;
    if (levelStart > limitMinLeft && (levelStart - blockSpacing) < limitMinLeft) {
      offset = width = levelStart - limitMinLeft;
      if (width > ganttHeaderWidth) {
        width = ganttHeaderWidth;
        hideRightBorder = true;
      }
    } else if (levelStart > limintMaxLeft && (levelStart - blockSpacing) < limintMaxLeft) {
      width = blockSpacing - (levelStart - limintMaxLeft);
      hideRightBorder = true;
    }
    newLevelBlocks.push({
      left: getRound(levelStart - offset),
      width: getRound(width),
      text: getBlockText(currentLevelStartDateInView, currentUnit),
      key: getRound(levelStart),
      tip: getBlockTip(currentLevelStartDateInView, currentUnit),
      hideRightBorder
    });
    currentLevelStartDateInView = currentLevelStartDateInView.add(1, currentUnit).endOf(currentUnit);
    blockSpacing = getBlockSpacingByUnit(currentLevelStartDateInView, currentUnit);
    levelStart += blockSpacing;

  }
  return newLevelBlocks;
};

const getBlockText = (date: dayjs.Dayjs, unit: GanttHeaderUnit) => {
  const currentLang = lang[localeRef.value];
  switch (unit) {
    case 'hour':
      return date.hour();
    case 'day':
      return date.date();
    case 'month':
      return currentLang.month[date.month() + 1];
    case 'year':
      return date.year();
    case 'week':
      return `${date.startOf('week').format('YYYY.MM.DD')}-${date.endOf('week').format('YYYY.MM.DD')}`;
    case 'quarter':
      return `${currentLang.month[date.startOf('quarter').month() + 1]}-${currentLang.month[date.endOf('quarter').month() + 1]}`;
  }

};

const getBlockTip = (date: dayjs.Dayjs, unit: GanttHeaderUnit) => {
  const dateFormat = lang[localeRef.value].dateFormat;
  switch (unit) {
    case 'hour':
      return date.format(dateFormat['hour']);
    case 'day':
      return date.format(dateFormat['day']);
    case 'month':
      return date.format(dateFormat['month']);
    case 'year':
      return date.format(dateFormat['year']);
    case 'week':
      return `${date.startOf('week').format('YYYY.MM.DD')}-${date.endOf('week').format('YYYY.MM.DD')}`;
    case 'quarter':
      return `${date.startOf('quarter').format(dateFormat['month'])}-${date.endOf('quarter').format(dateFormat['month'])}`;
  }

};

const getBlockSpacingByUnit = (date: dayjs.Dayjs, unit: GanttHeaderUnit) => {
  const { perHourSpacing } = props;

  switch (unit) {
    case 'hour':
      return perHourSpacing;
    case 'day':
      return perHourSpacing * 24;
    case 'week':
      return perHourSpacing * 24 * 7;
  }

  const startDate = date.startOf(unit);
  const diffHour = date.diff(startDate, 'hour', true);
  return diffHour * perHourSpacing;
};

watch([localeRef, startInfo, scrollViewScrollLeft], freshBlocks);

const onScroll = ({ scrollLeft }: { scrollLeft: number}) => {
  scrollViewScrollLeft.value = scrollLeft;
  ganttHeaderRef.value && (ganttHeaderRef.value.scrollLeft = scrollLeft);
};

const updateGanttHeaderWidth = (show: boolean, scrollbarWidth: number) => {
  if (show) {
    scrollLeftOffset.value = scrollbarWidth;
  } else {
    scrollLeftOffset.value = 0;
  }
};

const onResize = () => {
  freshBlocks();

};

defineExpose({
  onScroll,
  updateGanttHeaderWidth,
  onResize
});

</script>

<style lang="scss">
.vg-header {
  min-width: 100%;
  max-width: 100%;
  overflow: auto;
  color: #000;
  &::-webkit-scrollbar {
    display: none;
  }
  .vg-header-first-level, .vg-header-second-level {
    position: relative;

    .vg-header-block {
      position: absolute;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      border-right: 1px solid #e9e9e9;
      border-bottom: 1px solid #e9e9e9;
      .vg-header-block-text {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
      }
      &.vg-header-block-hide-right-border {
        border-right: none;
      }
    }
  }
}
</style>