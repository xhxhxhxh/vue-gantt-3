import { DOMWrapper, mount } from '@vue/test-utils';
import ScrollBar from '../ScrollBar.vue';
import { describe, expect, test } from '@jest/globals';
import { VueNode } from '@vue/test-utils/dist/types';
import { nextTick } from 'vue';
import defineGetter from '@/testUtil/define-getter';
import addScrollTo from '@/testUtil/scrollTo';
import makeScroll from '@/testUtil/make-scroll';

describe('scrollbar', () => {
  test('tag prop', () => {
    const wrapper = mount(ScrollBar, {
      props: {
        tag: 'p'
      },
      slots: {
        default: '<div></div>'
      }
    });

    const scrollView = wrapper.find('.vg-scrollbar-view').element;
    const nodeName = scrollView.nodeName;
    expect(nodeName).toBe('P');
  });

  test('style and class props', () => {
    const wrapper = mount(ScrollBar, {
      props: {
        viewClass: 'view-class',
        viewStyle: { background: 'red' },
        wrapClass: 'wrap-class',
        wrapStyle: { background: 'white' }
      },
    });

    const scrollWrap = wrapper.find('.vg-scrollbar-wrap').element as VueNode<HTMLDivElement>;
    const scrollView = wrapper.find('.vg-scrollbar-view').element as VueNode<HTMLDivElement>;

    expect(scrollView.classList.contains('view-class')).toBeTruthy();
    expect(scrollView.style.background).toBe('red');
    expect(scrollWrap.classList.contains('wrap-class')).toBeTruthy();
    expect(scrollWrap.style.background).toBe('white');
  });

  test('Only Horizontal', async () => {
    const outWidth = 200;
    const outHeight = 200;
    const innerWidth = 300;
    const innerHeight = 150;
    const wrapper = mount(ScrollBar, {
      attrs: {
        style: `width: ${outWidth}px; height: ${outHeight}px;`
      },
      slots: {
        default: `<div style="width: ${innerWidth}px; height: ${innerHeight}px;"></div>`
      }
    });
    const horizontalThumb = wrapper.find('.vg-scrollbar-thumb-wrap.is-horizontal');
    const verticalThumb = wrapper.find('.vg-scrollbar-thumb-wrap.is-vertical');
    const wrapView = wrapper.find('.vg-scrollbar-wrap').element as VueNode<HTMLDivElement>;
    const scrollView = wrapper.find('.vg-scrollbar-view').element as VueNode<HTMLDivElement>;

    defineGetter(wrapView, 'offsetWidth', outWidth);
    defineGetter(wrapView, 'offsetHeight', outHeight);
    defineGetter(scrollView, 'offsetWidth', innerWidth);
    defineGetter(scrollView, 'offsetHeight', innerHeight);
    wrapper.vm.onResize();
    await nextTick();
    expect(horizontalThumb.isVisible()).toBeTruthy();
    expect(verticalThumb.isVisible()).toBeFalsy();
  });

  test('Only Vertical', async () => {
    const outWidth = 200;
    const outHeight = 200;
    const innerWidth = 150;
    const innerHeight = 300;
    const wrapper = mount(ScrollBar, {
      attrs: {
        style: `width: ${outWidth}px; height: ${outHeight}px;`
      },
      slots: {
        default: `<div style="width: ${innerWidth}px; height: ${innerHeight}px;"></div>`
      }
    });
    const horizontalThumb = wrapper.find('.vg-scrollbar-thumb-wrap.is-horizontal');
    const verticalThumb = wrapper.find('.vg-scrollbar-thumb-wrap.is-vertical');
    const wrapView = wrapper.find('.vg-scrollbar-wrap').element as VueNode<HTMLDivElement>;
    const scrollView = wrapper.find('.vg-scrollbar-view').element as VueNode<HTMLDivElement>;

    defineGetter(wrapView, 'offsetWidth', outWidth);
    defineGetter(wrapView, 'offsetHeight', outHeight);
    defineGetter(scrollView, 'offsetWidth', innerWidth);
    defineGetter(scrollView, 'offsetHeight', innerHeight);
    wrapper.vm.onResize();
    await nextTick();
    expect(horizontalThumb.isVisible()).toBeFalsy();
    expect(verticalThumb.isVisible()).toBeTruthy();
  });

  test('always prop', async () => {
    const outWidth = 200;
    const outHeight = 200;
    const innerWidth = 150;
    const innerHeight = 150;
    const wrapper = mount(ScrollBar, {
      props: {
        alwayHorizontal: true,
        alwayVertical: true
      },
      attrs: {
        style: `width: ${outWidth}px; height: ${outHeight}px;`
      },
      slots: {
        default: `<div style="width: ${innerWidth}px; height: ${innerHeight}px;"></div>`
      }
    });
    const horizontalThumb = wrapper.find('.vg-scrollbar-thumb-wrap.is-horizontal');
    const verticalThumb = wrapper.find('.vg-scrollbar-thumb-wrap.is-vertical');
    const wrapView = wrapper.find('.vg-scrollbar-wrap').element as VueNode<HTMLDivElement>;
    const scrollView = wrapper.find('.vg-scrollbar-view').element as VueNode<HTMLDivElement>;

    defineGetter(wrapView, 'offsetWidth', outWidth);
    defineGetter(wrapView, 'offsetHeight', outHeight);
    defineGetter(scrollView, 'offsetWidth', innerWidth);
    defineGetter(scrollView, 'offsetHeight', innerHeight);
    wrapper.vm.onResize();
    await nextTick();
    expect(horizontalThumb.isVisible()).toBeTruthy();
    expect(verticalThumb.isVisible()).toBeTruthy();
  });

  test('Vertical scroll', async () => {
    const outWidth = 200;
    const outHeight = 200;
    const innerWidth = 300;
    const innerHeight = 300;
    const wrapper = mount(ScrollBar, {
      attrs: {
        style: `width: ${outWidth}px; height: ${outHeight}px;`
      },
      slots: {
        default: `<div style="width: ${innerWidth}px; height: ${innerHeight}px;"></div>`
      }
    });
    const horizontalThumb = wrapper.find('.vg-scrollbar-thumb-wrap.is-horizontal') as DOMWrapper<HTMLDivElement>;
    const verticalThumb = wrapper.find('.vg-scrollbar-thumb-wrap.is-vertical') as DOMWrapper<HTMLDivElement>;
    const wrapView = wrapper.find('.vg-scrollbar-wrap') as DOMWrapper<HTMLDivElement>;
    const scrollView = wrapper.find('.vg-scrollbar-view') as DOMWrapper<HTMLDivElement>;

    const wrapViewElement = wrapView.element;
    const scrollViewElement = scrollView.element;

    defineGetter(wrapViewElement, 'offsetWidth', outWidth);
    defineGetter(wrapViewElement, 'offsetHeight', outHeight);
    defineGetter(scrollViewElement, 'offsetWidth', innerWidth);
    defineGetter(scrollViewElement, 'offsetHeight', innerHeight);
    wrapper.vm.onResize();
    await nextTick();

    addScrollTo(verticalThumb.element);
    addScrollTo(horizontalThumb.element);
    addScrollTo(wrapViewElement);

    await makeScroll(wrapViewElement, 'scrollTop', 100);
    expect(verticalThumb.element.scrollTop).toBe(100);
    expect(horizontalThumb.element.scrollLeft).toBe(0);

    await makeScroll(verticalThumb.element, 'scrollTop', 60);
    expect(wrapViewElement.scrollTop).toBe(60);
  });

  test('Horizontal scroll', async () => {
    const outWidth = 200;
    const outHeight = 200;
    const innerWidth = 300;
    const innerHeight = 300;
    const wrapper = mount(ScrollBar, {
      attrs: {
        style: `width: ${outWidth}px; height: ${outHeight}px;`
      },
      slots: {
        default: `<div style="width: ${innerWidth}px; height: ${innerHeight}px;"></div>`
      }
    });
    const horizontalThumb = wrapper.find('.vg-scrollbar-thumb-wrap.is-horizontal') as DOMWrapper<HTMLDivElement>;
    const verticalThumb = wrapper.find('.vg-scrollbar-thumb-wrap.is-vertical') as DOMWrapper<HTMLDivElement>;
    const wrapView = wrapper.find('.vg-scrollbar-wrap') as DOMWrapper<HTMLDivElement>;
    const scrollView = wrapper.find('.vg-scrollbar-view') as DOMWrapper<HTMLDivElement>;

    const wrapViewElement = wrapView.element;
    const scrollViewElement = scrollView.element;

    defineGetter(wrapViewElement, 'offsetWidth', outWidth);
    defineGetter(wrapViewElement, 'offsetHeight', outHeight);
    defineGetter(scrollViewElement, 'offsetWidth', innerWidth);
    defineGetter(scrollViewElement, 'offsetHeight', innerHeight);
    wrapper.vm.onResize();
    await nextTick();

    addScrollTo(verticalThumb.element);
    addScrollTo(horizontalThumb.element);
    addScrollTo(wrapViewElement);

    await makeScroll(wrapViewElement, 'scrollLeft', 100);
    expect(horizontalThumb.element.scrollLeft).toBe(100);
    expect(verticalThumb.element.scrollTop).toBe(0);

    await makeScroll(horizontalThumb.element, 'scrollLeft', 60);
    expect(wrapViewElement.scrollLeft).toBe(60);
  });

  test('handle scroll', async () => {
    const outWidth = 200;
    const outHeight = 200;
    const innerWidth = 300;
    const innerHeight = 300;
    const wrapper = mount(ScrollBar, {
      attrs: {
        style: `width: ${outWidth}px; height: ${outHeight}px;`
      },
      slots: {
        default: `<div style="width: ${innerWidth}px; height: ${innerHeight}px;"></div>`
      }
    });
    const horizontalThumb = wrapper.find('.vg-scrollbar-thumb-wrap.is-horizontal') as DOMWrapper<HTMLDivElement>;
    const verticalThumb = wrapper.find('.vg-scrollbar-thumb-wrap.is-vertical') as DOMWrapper<HTMLDivElement>;
    const wrapView = wrapper.find('.vg-scrollbar-wrap') as DOMWrapper<HTMLDivElement>;
    const scrollView = wrapper.find('.vg-scrollbar-view') as DOMWrapper<HTMLDivElement>;

    const wrapViewElement = wrapView.element;
    const scrollViewElement = scrollView.element;

    defineGetter(wrapViewElement, 'offsetWidth', outWidth);
    defineGetter(wrapViewElement, 'offsetHeight', outHeight);
    defineGetter(scrollViewElement, 'offsetWidth', innerWidth);
    defineGetter(scrollViewElement, 'offsetHeight', innerHeight);
    wrapper.vm.onResize();
    await nextTick();

    addScrollTo(verticalThumb.element);
    addScrollTo(horizontalThumb.element);
    addScrollTo(wrapViewElement);

    wrapper.vm.scrollTo({ top: 50, left: 70 });

    await nextTick();

    expect(horizontalThumb.element.scrollLeft).toBe(70);
    expect(verticalThumb.element.scrollTop).toBe(50);
  });

  test('scroll emit', async () => {
    const outWidth = 200;
    const outHeight = 200;
    const innerWidth = 300;
    const innerHeight = 300;
    const wrapper = mount(ScrollBar, {
      attrs: {
        style: `width: ${outWidth}px; height: ${outHeight}px;`
      },
      slots: {
        default: `<div style="width: ${innerWidth}px; height: ${innerHeight}px;"></div>`
      }
    });
    const horizontalThumb = wrapper.find('.vg-scrollbar-thumb-wrap.is-horizontal') as DOMWrapper<HTMLDivElement>;
    const verticalThumb = wrapper.find('.vg-scrollbar-thumb-wrap.is-vertical') as DOMWrapper<HTMLDivElement>;
    const wrapView = wrapper.find('.vg-scrollbar-wrap') as DOMWrapper<HTMLDivElement>;
    const scrollView = wrapper.find('.vg-scrollbar-view') as DOMWrapper<HTMLDivElement>;

    const wrapViewElement = wrapView.element;
    const scrollViewElement = scrollView.element;

    defineGetter(wrapViewElement, 'offsetWidth', outWidth);
    defineGetter(wrapViewElement, 'offsetHeight', outHeight);
    defineGetter(scrollViewElement, 'offsetWidth', innerWidth);
    defineGetter(scrollViewElement, 'offsetHeight', innerHeight);
    wrapper.vm.onResize();
    await nextTick();

    addScrollTo(verticalThumb.element);
    addScrollTo(horizontalThumb.element);
    addScrollTo(wrapViewElement);

    await makeScroll(wrapViewElement, 'scrollLeft', 100);

    expect(wrapper.emitted().scroll[0]).toEqual([{ scrollTop: 0, scrollLeft: 100 }]);

    await makeScroll(wrapViewElement, 'scrollTop', 100);
    expect(wrapper.emitted().scroll[1]).toEqual([{ scrollTop: 100, scrollLeft: 100 }]);

    await makeScroll(horizontalThumb.element, 'scrollLeft', 50);
    expect(wrapper.emitted().scroll[2]).toEqual([{ scrollTop: 100, scrollLeft: 50 }]);

    await makeScroll(verticalThumb.element, 'scrollTop', 50);
    expect(wrapper.emitted().scroll[3]).toEqual([{ scrollTop: 50, scrollLeft: 50 }]);

  });
});

