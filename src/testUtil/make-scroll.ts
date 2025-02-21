import { isUndefined } from 'lodash';
import { sleep } from '@/util';

const makeScroll = (
  dom: Element,
  name: 'scrollTop' | 'scrollLeft',
  offset: number
) => {
  const eventTarget = dom === document.documentElement ? window : dom;
  dom[name] = offset;
  const evt = new CustomEvent('scroll', {
    detail: {
      target: {
        [name]: offset,
      },
    },
  });
  eventTarget.dispatchEvent(evt);
  return sleep(0);
};

export const makeScrollTo = (
  dom: Element,
  options: {top?: number, left?: number}
) => {
  const eventTarget = dom === document.documentElement ? window : dom;

  const target = {} as any;
  if (!isUndefined(options.top)) {
    dom['scrollTop'] = target['scrollTop'] = options.top;
  }
  if (!isUndefined(options.left)) {
    dom['scrollLeft'] = target['scrollLeft'] = options.left;
  }
  const evt = new CustomEvent('scroll', {
    detail: {
      target,
    },
  });
  eventTarget.dispatchEvent(evt);

};

export default makeScroll;
