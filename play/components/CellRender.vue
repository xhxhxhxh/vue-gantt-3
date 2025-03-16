<template>
  <div class="vg-play-cell" @dblclick="handleDbClick">
    <input v-if="isEdit"
           v-model="inputValue"
           v-focus
           type="text"
           @blur="handleBlur">
    <span v-else>{{ rowValue }}</span>
  </div>
</template>
<script lang="ts" setup>
import { ref, computed, watch } from "vue";

const vFocus = {
  mounted: (el: HTMLInputElement) => {
    el.focus();
  }
};

const props = defineProps<{
  params: any
}>();

const field = ref(props.params.colDef.field as string);

const rowValue = computed(() => {
  return props.params.data[field.value] as string;
});
const inputValue = ref(rowValue.value);

watch(rowValue, val => {
  inputValue.value = val;
});

const isEdit = ref(false);

const handleDbClick = () => {
  isEdit.value = true;
};

const handleBlur = (e: FocusEvent) => {
  isEdit.value = false;
  props.params.setValue(inputValue.value);
};
</script>
<style lang="scss">
.vg-play-cell {
  line-height: 22px;
  input {
    width: 100%;
    outline: none;
  }
}
</style>