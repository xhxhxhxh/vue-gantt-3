import { makeScrollTo } from './make-scroll';

const addScrollTo = (
  dom: Element
) => {
  dom.scrollTo = (options?: number | ScrollToOptions) => {
    const scrollOption = options as ScrollToOptions;
    makeScrollTo(dom, scrollOption);
  };
};

export default addScrollTo;