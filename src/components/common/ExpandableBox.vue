<template>
  <div class="c-expandable-box">
    <div :style="boxStyle"
         style="overflow:hidden;height:100%"
         :class="contentClass"
         class="c-expandable-box-body">
      <slot/>
    </div>
    <div v-if="draglineShow"
         class="_drag-line"
         :class="{indragging}"
         @mousedown="handleMouseDown" />
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'common-expandable-box',
  components: {},
  props: {
    draglineShow: {
      type: Boolean,
      default: true
    },
    initWidth: {
      type: Number,
      default: 244,
    },
    minWidth: {
      type: Number,
      default: 154,
    },
    maxWidth: {
      type: Number,
      required: true
    },
    contentClass: String,
  },
  emits: ["width-change"],
  data() {
    return {
      mouseStartX: 0,
      width: this.initWidth,
      originWidth: 0,
      hasDragged: false,
      indragging: false
    };
  },
  computed: {
    boxStyle() {
      return {
        width: this.width + 'px',
      };
    },
  },
  watch: {
    initWidth(val) {
      if (this.hasDragged) return;
      if (val > this.maxWidth) {
        this.width = this.maxWidth;
      } else if (val < this.minWidth) {
        this.width = this.minWidth;
      } else {
        this.width = val;
      }
    },
  },
  mounted() {
    this.$emit('width-change', this.width);

  },
  methods: {
    handleMouseDown(event:MouseEvent) {
      this.mouseStartX = event.clientX;
      this.originWidth = this.width;
      this.indragging = true;
      window.addEventListener('mousemove', this.handleMouseMove, true);
      window.addEventListener('mouseup', this.handleMouseUp, true);
    },
    handleMouseUp() {
      this.hasDragged = true;
      this.indragging = false;
      window.removeEventListener('mousemove', this.handleMouseMove, true);
      window.removeEventListener('mouseup', this.handleMouseUp, true);
    },
    handleMouseMove(event:MouseEvent) {
      const mouseEndX = event.clientX;
      let changeWidth = mouseEndX - this.mouseStartX;
      let width = this.originWidth + changeWidth;
      this.width = Math.max(this.minWidth, Math.min(this.maxWidth, width));

      this.$emit('width-change', this.width);
    },
  },
});
</script>
<style lang="scss">
.c-expandable-box {
  height: 100%;
  position: relative;

  ._drag-line {
    position: absolute;
    background:transparent;
    right: 1px;
    width: 4px;
    cursor: url("/statics/images/myCursor.cur"), col-resize !important;
    // opacity: 0;
    // background-color: red;
    height: 100%;
    top: 0;
    z-index:1;
    &.indragging {
      background-color: #A2B3CD;
    }
  }
}
</style>