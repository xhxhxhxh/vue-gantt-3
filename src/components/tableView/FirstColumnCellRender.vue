<template>
  <div class="vg-cell-expandable" :style="{paddingLeft: currentPaddingLeft + 'px'}">
    <span v-if="rowNode?.hasChildren"
          class="vg-cell-expand-box"
          :style="{left: positionLeft + 'px'}"
          @mousedown.stop="setExpand">
      <span v-show="rowNode.expand" class="vg-cell-shrink-icon">
        <img src="../../assets/images/shrink.svg" alt="">
      </span>
      <span v-show="!rowNode.expand" class="vg-cell-spread-icon">
        <img src="../../assets/images/spread.svg" alt="">
      </span>
    </span>
    <component :is="params.component" v-if="params.component" :params="params"></component>
    <div v-else>{{props.params.value}}</div>
  </div>
</template>
<script lang="ts" setup>
import { ref, shallowRef } from "vue";
import type { FirstColumnCellRenderParams } from '@/types';

const props = defineProps<{
  params: FirstColumnCellRenderParams
}>();
const basePaddingLeft = 18;
const rowNode = shallowRef(props.params.rowNode);
const level = ref(rowNode.value?.level || 0);
const currentPaddingLeft = basePaddingLeft + level.value * 14;
const positionLeft = currentPaddingLeft - 14;

const setExpand = (event: MouseEvent) => {
  const currentRowNode = rowNode.value;
  if (currentRowNode) {
    event.button === 0 && currentRowNode.setExpand(currentRowNode.id, !currentRowNode.expand);
    currentRowNode.setSelect(currentRowNode.id);
  }
};

</script>
<style lang="scss">
.vg-cell-expandable {
  margin-left: -7px;
  height: 100%;
  position: relative;
  .vg-cell-expand-box {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: inline-block;
    line-height: 1;
    font-size: 0;
    img {
      vertical-align: middle;
    }
  }
}
</style>
