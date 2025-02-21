<template>
  <div class="m-scrollbar"
       :style="{paddingBottom: horizontalVisible ? `${scrollbarHeight}px` : 0,
                paddingRight: verticalVisible ? `${scrollbarWidth}px` : 0}">
    <div ref="wrapRef"
         class="m-scrollbar-wrap"
         :class="wrapClass"
         :style="wrapStyle"
         @wheel="handleWheel"
         @scroll="handleScroll">
      <component
        :is="tag"
        ref="resizeRef"
        class="m-scrollbar-view"
        :class="viewClass"
        :style="viewStyle"
      >
        <slot />
      </component>
    </div>
    <Bar
      ref="barRef"
      :scrollbarWidth="scrollbarWidth"
      :scrollbarHeight="scrollbarHeight"
      :horizontalWidth="horizontalWidth"
      :verticalHeight="verticalHeight"
      :horizontalVisible="horizontalVisible"
      :verticalVisible="verticalVisible"
      @triggerScrollFromThumb="triggerScrollFromThumb"/>
  </div>
</template>
<script lang="ts" setup>
import type { StyleValue } from 'vue';
import { ref, provide, watch } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import Bar from './Bar.vue';
import type BarInstance from './Bar.vue';

export interface Props {
  tag?: string,
  viewClass?: string,
  wrapClass?: string,
  viewStyle?: StyleValue,
  wrapStyle?: StyleValue,
  interceptShiftScroll?: boolean,
  alwayHorizontal?: boolean, // 水平滚动条总是显示
  alwayVertical?: boolean // 垂直滚动条总是显示
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'div',
  alwayHorizontal: false,
  alwayVertical: false,
  interceptShiftScroll: false
});

const emit = defineEmits<{
  (event: 'scroll', { scrollTop, scrollLeft }: {scrollTop: number, scrollLeft: number}): void,
  (event: 'resize', target: HTMLDivElement): void,
  (event: 'wrapResize', target: HTMLDivElement): void,
  (event: 'shiftScroll', e: WheelEvent): void,
  (event: 'wheel', e: WheelEvent): void,
  (event: 'verticalScrollBarShow', { show, scrollbarWidth }: {show: boolean, scrollbarWidth: number}): void,
}>();

const resizeRef = ref<HTMLDivElement>();
const wrapRef = ref<HTMLDivElement>();
const barRef = ref<InstanceType<typeof BarInstance>>();
const horizontalWidth = ref(0);
const verticalHeight = ref(0);
const horizontalVisible = ref(false);
const verticalVisible = ref(false);
const scrollFromThumb = ref(false);

provide(
  'wrapRef',
  wrapRef
);

provide(
  'scrollFromThumb',
  scrollFromThumb
);

function getScrollbarSize () {
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  document.body.appendChild(outer);

  const inner = document.createElement('div');
  inner.style.height = '100%';
  outer.appendChild(inner);

  const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);
  const scrollbarHeight = (outer.offsetHeight - inner.offsetHeight);

  document.body.removeChild(outer);

  return { scrollbarWidth, scrollbarHeight };
}

const { scrollbarWidth, scrollbarHeight } = getScrollbarSize();

watch(verticalVisible, (val) => {
  emit('verticalScrollBarShow', { show: val, scrollbarWidth });
});

const onResize = () => {
  console.log('onResize');
  if (!resizeRef.value || !wrapRef.value) return;
  const resizeRefWidth = resizeRef.value?.offsetWidth;
  const resizeRefHeight = resizeRef.value?.offsetHeight;
  const wrapRefOffsetWidth = wrapRef.value?.offsetWidth;
  const wrapRefOffsetHeight = wrapRef.value?.offsetHeight;

  horizontalWidth.value = resizeRefWidth;
  verticalHeight.value = resizeRefHeight;

  console.log(resizeRefWidth, wrapRefOffsetWidth, resizeRefHeight, wrapRefOffsetHeight);

  if (resizeRefWidth > wrapRefOffsetWidth) {
    horizontalVisible.value = true;
  } else {
    horizontalVisible.value = props.alwayHorizontal || false;
  }

  if (resizeRefHeight > wrapRefOffsetHeight) {
    verticalVisible.value = true;
  } else {
    verticalVisible.value = props.alwayVertical || false;
  }

  // emit('resize', resizeRef.value);
};

const onWrapResize = () => {
  console.log('onWrapResize');
  wrapRef.value && emit('resize', wrapRef.value);
};

useResizeObserver(resizeRef, onResize);
useResizeObserver(wrapRef, onWrapResize);

const handleScroll = () => {
  if (wrapRef.value && barRef.value) {
    if (!scrollFromThumb.value) {
      console.log('wrap scroll', wrapRef.value.scrollTop);
      emit('scroll', { scrollTop: wrapRef.value.scrollTop, scrollLeft: wrapRef.value.scrollLeft });
      barRef.value.handleScroll(wrapRef.value);
    } else {
      scrollFromThumb.value = false;
    }
  }
};

const triggerScrollFromThumb = (options: ScrollToOptions) => {
  scrollTo(options);
  if (wrapRef.value && barRef.value) {
    const scrollLeft = options.left === undefined ? wrapRef.value.scrollLeft : options.left;
    const scrollTop = options.top === undefined ? wrapRef.value.scrollTop : options.top;
    emit('scroll', { scrollLeft, scrollTop });
  }
};

const triggerScrollFromOutSide = (options: ScrollToOptions) => {
  triggerScrollFromThumb(options);
  if (wrapRef.value && barRef.value) {
    barRef.value?.handleScroll(wrapRef.value);
  }
  scrollFromThumb.value = true;
};

const handleWheel = (e: WheelEvent) => {
  if (props.interceptShiftScroll && e.shiftKey) {
    emit('shiftScroll', e);
  } else {
    emit('wheel', e);
  }
};

const scrollTo = (options: ScrollToOptions) => {
  wrapRef.value!.scrollTo(options);
};

defineExpose({
  onResize,
  scrollTo,
  handleScroll,
  triggerScrollFromOutSide
});

</script>
<style lang="scss">
.m-scrollbar {
  position: relative;
  overflow: hidden;
  .m-scrollbar-wrap {
    width: 100%;
    height: 100%;
    overflow: auto;
    &::-webkit-scrollbar {
      display: none;
    }
    .m-scrollbar-view {
      width: fit-content;
      height: fit-content;
    }
  }
}
</style>