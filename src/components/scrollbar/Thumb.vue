<template>
  <div ref="thumbRef"
       class="vg-scrollbar-thumb-wrap"
       :class="isHorizontal ? 'is-horizontal' : 'is-vertical'"
       @scroll="onScroll"
       @mouseenter="mouseHover = true"
       @mouseleave="mouseHover = false">
    <div class="vg-scrollbar-thumb" :style="{width: width + 'px', height: height + 'px'}"></div>
  </div>
</template>
<script lang="ts" setup>
import { ref, inject } from 'vue';
import type { Ref } from 'vue';

export interface Props {
  width: number,
  height: number,
  isHorizontal?: boolean
}

const emit = defineEmits<{
  (event: 'triggerScrollFromThumb', options: ScrollToOptions): void,
}>();

const props = defineProps<Props>();
const thumbRef = ref<HTMLDivElement>();
const wrapRef = inject('wrapRef') as Ref<HTMLDivElement | undefined>;
const scrollFromThumb = inject('scrollFromThumb') as Ref<boolean>;
const scrollFromWrap = ref(false);
const mouseHover = ref(false);

const handleScroll = (option: {left: number, top: number}) => {
  if (thumbRef.value && !scrollFromThumb.value) {
    scrollFromWrap.value = true;
    thumbRef.value.scrollTo(option);
  }
};

const onScroll = () => {
  if (scrollFromWrap.value) {
    scrollFromWrap.value = false;
    return;
  }
  if (wrapRef.value && thumbRef.value) {
    console.log('thumb scroll');

    scrollFromThumb.value = true;
    const { scrollTop, scrollLeft } = thumbRef.value;
    if (props.isHorizontal) {
      emit('triggerScrollFromThumb', { left: scrollLeft });
    } else {
      emit('triggerScrollFromThumb', { top: scrollTop });
    }
  }

};

defineExpose({
  handleScroll,
});
</script>