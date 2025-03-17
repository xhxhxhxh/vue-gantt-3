import { ref, onBeforeUnmount } from 'vue';
import type { Ref } from 'vue';

export const useTableScroll = ({
  tableBodyView,
  tableBodyVerticalScrollViewport,
  emitTriggerGanttViewScroll
}: {
  tableBodyView: Ref<HTMLDivElement | null>,
  tableBodyVerticalScrollViewport: Ref<HTMLDivElement | null>,
  emitTriggerGanttViewScroll: (options: ScrollToOptions) => void
}) => {
  const scrollFromGanttView = ref(false);

  onBeforeUnmount(() => {
    tableBodyView.value?.removeEventListener('wheel', bodyWheel);
    tableBodyVerticalScrollViewport.value?.removeEventListener('scroll', verticalScrollViewportScroll);
  });

  /**
   * per scroll will trigger this function
   * @returns
   */
  const verticalScrollViewportScroll = () => {

    if (scrollFromGanttView.value) {
      scrollFromGanttView.value = false;
    } else {
      emitTriggerGanttViewScroll({ top: tableBodyVerticalScrollViewport.value?.scrollTop });
    }
  };

  /**
   * prevent scroll default to keep scrolling consistent with gantt view,
   * The disadvantage is that it will scroll directly to the specified position, and the intermediate scrolling process cannot be seen
   * @param e
   * @returns
   */
  const bodyWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (!tableBodyVerticalScrollViewport.value) return;
    if (Math.abs(e.deltaY) < 3) return;
    scrollFromGanttView.value = false;
    const scrollSpeed = 100;
    const scrollDistance = e.deltaY > 0 ? scrollSpeed : -scrollSpeed;
    const scrollTop = tableBodyVerticalScrollViewport.value?.scrollTop + scrollDistance;
    tableBodyVerticalScrollViewport.value?.scrollTo({ top: scrollTop });
  };

  const scrollTo = (options: ScrollToOptions, onWheel?: boolean) => {
    scrollFromGanttView.value = true;

    if (onWheel) {
      tableBodyVerticalScrollViewport.value?.scrollTo(options);
    } else {
      tableBodyView.value?.scrollTo(options);
      // 当新的options值与现有滚动条位置一致时，不会再次触发scroll事件，需要手动将scrollFromTableBody设为false
      if (tableBodyVerticalScrollViewport.value?.scrollTop === options.top) {
        scrollFromGanttView.value = false;
      }
    }
  };

  return {
    scrollTo,
    bodyWheel,
    verticalScrollViewportScroll
  };
};