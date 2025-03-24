<template>
  <Thumb v-show="horizontalVisible"
         ref="horizontalThumbRef"
         :isHorizontal="true"
         :width="horizontalWidth"
         :height="scrollbarHeight"
         :style="{maxHeight: scrollbarHeight + 'px', width: `calc(100% - ${verticalVisible ? scrollbarWidth : 0}px)`}"
         @triggerScrollFromThumb="triggerScrollFromThumb"/>
  <Thumb v-show="verticalVisible"
         ref="verticalThumbRef"
         :isHorizontal="false"
         :height="verticalHeight"
         :width="scrollbarWidth"
         :style="{maxWidth: scrollbarWidth + 'px', height: `calc(100% - ${horizontalVisible ? scrollbarHeight : 0}px)`}"
         @triggerScrollFromThumb="triggerScrollFromThumb"/>
</template>
<script lang="ts" setup>
import Thumb from './Thumb.vue';
import { ref } from 'vue';
import type ThumbInstance from './Thumb.vue';

export interface Props {
  horizontalWidth: number,
  verticalHeight: number,
  horizontalVisible: boolean,
  verticalVisible: boolean,
  scrollbarHeight?: number,
  scrollbarWidth?: number
}
withDefaults(defineProps<Props>(), {
  scrollbarHeight: 0,
  scrollbarWidth: 0
});
const emit = defineEmits<{
  (event: 'triggerScrollFromThumb', options: ScrollToOptions): void,
}>();
const horizontalThumbRef = ref<InstanceType<typeof ThumbInstance>>();
const verticalThumbRef = ref<InstanceType<typeof ThumbInstance>>();

const handleScroll = (wrap: HTMLDivElement) => {
  const { scrollTop, scrollLeft } = wrap;
  if (horizontalThumbRef.value) {
    horizontalThumbRef.value.handleScroll({ top: 0, left: scrollLeft });

  }
  if (verticalThumbRef.value) {
    verticalThumbRef.value.handleScroll({ top: scrollTop, left: 0 });

  }
};

const triggerScrollFromThumb = (options: ScrollToOptions) => {
  emit('triggerScrollFromThumb', options);
};

defineExpose({
  handleScroll,
});

</script>
<style lang="scss" >
.vg-scrollbar-thumb-wrap {
  position: absolute;
  overflow: auto;
  &.is-horizontal {
    left: 0;
    bottom: 0;
    overflow-y: hidden;
  }
  &.is-vertical {
    top: 0;
    right: 0;
    overflow-x: hidden;

  }
}
</style>