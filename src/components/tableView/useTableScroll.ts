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
      tableBodyVerticalScrollViewport.value?.scrollTo(options);
      // if the new options value is consistent with the current scrollbar position, the scroll event will not be triggered again,
      // and you need to manually set scrollFromTableBody to false
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